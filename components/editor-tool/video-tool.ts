import { BlockTool } from '@editorjs/editorjs';
import { videoUploader } from '@/components/editor/EditorUploaders';

declare global {
  interface Window {
    FB?: {
      XFBML?: {
        parse?: (container?: HTMLElement) => void;
      };
    };
    instgrm?: {
      Embeds?: {
        process?: () => void;
      };
    };
  }
}

interface VideoData {
  url: string;
  type: 'upload' | 'embed';
  provider?: string;
  videoId?: string;
}

const FB_PLAYER_WIDTH = 400;

// Accepts raw Facebook embed block with data-href
const FB_EMBED_BLOCK_REGEX = /<div id="fb-root[\s\S.]*?data-href="([^"]+).*fb-xfbml-parse-ignore"><\/div><\/div>/i;

const VIDEO_EMBED_PATTERNS = [
  {
    name: 'YouTube',
    regex: /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/,
    getEmbed: (id: string) =>
      `<iframe width="340" height="220" src="https://www.youtube.com/embed/${id}?rel=0" frameborder="0" allowfullscreen></iframe>`,
    provider: 'youtube'
  },
  {
    name: 'Facebook',
    // Matches /videos/ID, /reel/ID, /watch?v=ID
    regex: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/(?:(?:[^/]+\/videos|reel)\/([0-9]+)|watch\/?\?v=([0-9]+))/,
    getEmbed: (_id: string, url: string) =>
      `<div class="fb-video" data-href="${url}" data-width="${FB_PLAYER_WIDTH}" data-show-text="false"></div>`,
    provider: 'facebook'
  },
  {
    name: 'TikTok',
    regex: /tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
    getEmbed: (_id: string, url: string) =>
      `<blockquote class="tiktok-embed" cite="${url}" data-video-id="${_id}" style="max-width: 340px; width: 100%;">
        <section> </section>
      </blockquote>`,
    provider: 'tiktok'
  },
  {
    name: 'Instagram',
    regex: /instagram\.com\/(?:reel|tv|p)\/([\w-]+)/,
    getEmbed: (_id: string, url: string) =>
      `<blockquote class="instagram-media" data-instgrm-permalink="${url}" style="width:340px; max-width:100%;"></blockquote>`,
    provider: 'instagram'
  }
];

export default class VideoTool implements BlockTool {
  private data: VideoData = { url: '', type: 'upload' };
  private wrapper: HTMLElement | null = null;
  private fileInput: HTMLInputElement | null = null;

  static get toolbox() {
    return {
      title: 'Video',
      icon: `
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#5ac5fa" stroke-width="2">
          <rect x="2" y="5" width="17" height="14" rx="3" fill="#5ac5fa" opacity="0.16"/>
          <polygon points="9,8 15,12 9,16" fill="#5ac5fa"/>
        </svg>
      `
    };
  }

  constructor({ data }: { data?: VideoData }) {
    this.data = data || { url: '', type: 'upload' };
  }

  render(): HTMLElement {
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'video-block-wrapper';

    if (this.data.url) {
      this.renderVideoOnlyPreview();
    } else {
      this.renderUploadEmbedSection();
    }
    return this.wrapper;
  }

  private renderVideoOnlyPreview() {
    if (!this.wrapper) return;
    this.wrapper.innerHTML = '';

    const preview = document.createElement('div');
    preview.className = 'video-player-box';

    let player: HTMLElement | null = null;

    if (this.data.type === 'upload') {
      player = document.createElement('video');
      (player as HTMLVideoElement).src = this.data.url;
      (player as HTMLVideoElement).controls = true;
      player.className = 'video-player';
      (player as HTMLVideoElement).width = 340;
      (player as HTMLVideoElement).height = 220;
    } else if (this.data.provider) {
      const pattern = VIDEO_EMBED_PATTERNS.find(
        p => p.provider === this.data.provider
      );
      player = document.createElement('div');
      player.className = 'video-embed-block';
      if (pattern) {
        player.innerHTML = pattern.getEmbed?.(this.data.videoId || '', this.data.url) || '';
        setTimeout(() => this.mountProviderPlayer(player!), 0);
      }
    }

    if (player) preview.appendChild(player);

    const replaceBtn = document.createElement('button');
    replaceBtn.className = 'video-action-replace';
    replaceBtn.title = 'Replace Video';
    replaceBtn.innerHTML = `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" stroke-width="2">
      <path d="M4 7v13h17V7M12 3v8"/><path d="M1 9h22M16 1h-8v6h8zm-2 2v2"/>
      </svg>Replace`;
    replaceBtn.onclick = () => this.renderUploadEmbedSection();

    const actions = document.createElement('div');
    actions.className = 'video-inline-actions';
    actions.appendChild(replaceBtn);
    preview.appendChild(actions);

    this.wrapper.appendChild(preview);
  }

  private renderUploadEmbedSection() {
    if (!this.wrapper) return;
    this.wrapper.innerHTML = '';

    const dropArea = document.createElement('div');
    dropArea.className = 'video-upload-droparea';
    dropArea.innerHTML = `
      <div class="video-upload-center">
        <div class="video-upload-icon">
          <svg width="52" height="52" fill="none" viewBox="0 0 24 24" stroke="#5ac5fa" stroke-width="2">
            <rect x="2" y="5" width="17" height="14" rx="3" fill="#5ac5fa" opacity="0.19"/>
            <polygon points="9,8 15,12 9,16" fill="#5ac5fa"/>
          </svg>
        </div>
        <div class="video-upload-title">Upload a video file or paste a link</div>
        <div class="video-upload-desc">Drag and drop your MP4 video here, click to browse, or use a video link below</div>
        <div class="video-upload-tip">Supports YouTube, Facebook, TikTok, Instagram links, or MP4 files up to 100MB</div>
      </div>
    `;
    dropArea.onclick = () => this.fileInput?.click();

    dropArea.ondragover = (e) => { e.preventDefault(); dropArea.classList.add('is-over'); };
    dropArea.ondragleave = () => dropArea.classList.remove('is-over');
    dropArea.ondrop = async (e) => {
      e.preventDefault();
      dropArea.classList.remove('is-over');
      const file = (e.dataTransfer?.files && e.dataTransfer.files[0]) || null;
      if (file) await this.handleFile(file);
    };

    this.fileInput = document.createElement('input');
    this.fileInput.type = 'file';
    this.fileInput.accept = 'video/mp4';
    this.fileInput.style.display = 'none';
    this.fileInput.onchange = async () => {
      const file = this.fileInput?.files?.[0];
      if (file) await this.handleFile(file);
    };

    // Embedding Section
    const embedSection = document.createElement('div');
    embedSection.className = 'video-link-embed-section';
    embedSection.innerHTML = `
      <div class="video-link-input-wrapper" style="margin-top:16px; display:flex; align-items:center;">
        <input
          type="text"
          class="video-link-input"
          placeholder="Paste a YouTube, Facebook video/reel/watch link, Instagram, TikTok URL, or Facebook embed block"
          style="width: 340px; padding: 8px; border-radius: 4px; border: 1px solid #cceafd;"
        />
        <button class="video-link-embed-btn" style="margin-left: 8px; padding: 8px 14px; background: #5ac5fa; color: #fff; border: none; border-radius: 4px; cursor: pointer;">
          Embed
        </button>
      </div>
      <div class="video-link-format-tip" style="margin-top: 8px; color: #6ccffc; font-size: 12px;">
        Facebook formats supported: 
        <br>
        <code>https://facebook.com/{page}/videos/{id}</code>, 
        <code>https://facebook.com/watch?v={id}</code>, 
        <code>https://facebook.com/reel/{id}</code> &amp; raw Facebook embed blocks.<br>
        Share links are <strong>not supported</strong>.
      </div>
    `;
    const inputEl = embedSection.querySelector('input')!;
    const btnEl = embedSection.querySelector('button')!;

    btnEl.onclick = () => this.handleEmbedURL(inputEl.value.trim());
    inputEl.onkeydown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        this.handleEmbedURL(inputEl.value.trim());
      }
    };

    this.wrapper.appendChild(dropArea);
    this.wrapper.appendChild(this.fileInput);
    this.wrapper.appendChild(embedSection);
  }

  private async handleFile(file: File) {
    if (file.type !== 'video/mp4') {
      alert('Only MP4 files allowed.');
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      alert('File must be less than 100MB.');
      return;
    }
    try {
      const result = await videoUploader(file);
      if (result.success && result.file && result.file.url) {
        this.data = {
          url: result.file.url,
          type: 'upload'
        };
        this.renderVideoOnlyPreview();
      } else {
        alert(result.message || 'Upload failed');
      }
    } catch {
      alert('Upload failed');
    }
  }

  // Enhanced to accept Facebook watch, reel, video links, and raw embed
  private handleEmbedURL(url: string) {
    if (!url) {
      alert('Please enter a video URL');
      return;
    }

    // 1. Detect raw Facebook embed HTML
    const fbMatch = url.match(FB_EMBED_BLOCK_REGEX);
    if (fbMatch) {
      const fbVideoUrl = fbMatch[1];
      this.data = {
        url: fbVideoUrl,
        type: 'embed',
        provider: 'facebook',
        videoId: undefined
      };
      this.renderVideoOnlyPreview();
      return;
    }

    // 2. URL pattern matchers
    for (const pattern of VIDEO_EMBED_PATTERNS) {
      const match = url.match(pattern.regex);
      if (match) {
        this.data = {
          url,
          type: 'embed',
          provider: pattern.provider,
          videoId: match[1] || match[2] // handle both group 1 and 2 for Facebook
        };
        this.renderVideoOnlyPreview();
        return;
      }
    }
    alert('Unsupported video URL or provider.\n\nPlease use direct YouTube/Facebook/TikTok/Instagram video links, not share links. See the input hint for examples.');
  }

  /** Handle provider-specific post-render operations (e.g. SDK, parse) */
  private async mountProviderPlayer(playerDiv: HTMLElement) {
    // Facebook
    if (this.data.provider === 'facebook') {
      if (!document.getElementById('fb-root')) {
        const fbroot = document.createElement('div');
        fbroot.id = 'fb-root';
        document.body.appendChild(fbroot);
      }
      if (!document.getElementById('fb-sdk')) {
        const fbScript = document.createElement('script');
        fbScript.id = 'fb-sdk';
        fbScript.src = "https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v17.0";
        fbScript.async = true;
        fbScript.onerror = () => {
          // Show a user-friendly message if blocked
          const errorMsg = document.createElement('div');
          errorMsg.style.color = 'red';
          errorMsg.style.margin = '8px 0';
          errorMsg.textContent = 'Facebook video embed cannot be loaded. The Facebook SDK was blocked by your browser or an extension.';
          playerDiv.appendChild(errorMsg);
        };
        document.body.appendChild(fbScript);
        fbScript.onload = () => this.callFBParse(playerDiv);
      } else {
        this.waitForFBSDK(playerDiv, 0);
      }
    }

    // TikTok
    if (this.data.provider === 'tiktok') {
      if (!document.getElementById('tiktok-sdk')) {
        const script = document.createElement('script');
        script.id = 'tiktok-sdk';
        script.src = "https://www.tiktok.com/embed.js";
        script.async = true;
        document.body.appendChild(script);
      }
    }

    // Instagram
    if (this.data.provider === 'instagram') {
      if (!document.getElementById('instagram-sdk')) {
        const script = document.createElement('script');
        script.id = 'instagram-sdk';
        script.src = "https://www.instagram.com/embed.js";
        script.async = true;
        document.body.appendChild(script);
        script.onload = () => this.callInstagramParse();
      } else {
        this.callInstagramParse();
      }
    }
  }

  private waitForFBSDK(container: HTMLElement, attempt: number) {
    interface FBWindow extends Window {
      FB?: {
        XFBML?: {
          parse?: (container?: HTMLElement) => void;
        };
      };
    }
    const win = window as FBWindow;
    if (win.FB && win.FB.XFBML && typeof win.FB.XFBML.parse === 'function') {
      this.callFBParse(container);
    } else if (attempt < 30) {
      setTimeout(() => this.waitForFBSDK(container, attempt + 1), 200);
    }
  }

  private callFBParse(container: HTMLElement) {
    try {
      if (window.FB && window.FB.XFBML && typeof window.FB.XFBML.parse === 'function') {
        window.FB.XFBML.parse(container);
        setTimeout(() => {
          if (window.FB && window.FB.XFBML && typeof window.FB.XFBML.parse === 'function') {
            window.FB.XFBML.parse(container);
          }
        }, 1000);
      }
    } catch {/* swallow */}
  }

  private callInstagramParse() {
    interface InstgrmWindow extends Window {
      instgrm?: {
        Embeds?: {
          process?: () => void;
        };
      };
    }
    const win = window as InstgrmWindow;
    if (win.instgrm && win.instgrm.Embeds && typeof win.instgrm.Embeds.process === 'function') {
      win.instgrm.Embeds.process();
    }
  }

  save() {
    return this.data;
  }
  validate(data: VideoData) {
    return !!data.url;
  }
}