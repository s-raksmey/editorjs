import { BlockTool } from '@editorjs/editorjs';
import { videoUploader } from '@/components/editor/EditorUploaders';

interface VideoData {
  url: string;
  type: 'upload' | 'embed';
  provider?: string;
  videoId?: string;
}


const FB_PLAYER_WIDTH = 400; // <--- control width here

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
    regex: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/[^/]+\/videos\/([0-9]+)/,
    getEmbed: (_id: string, url: string) =>
      `<div class="fb-video" data-href="${url}" data-width="${FB_PLAYER_WIDTH}" data-show-text="false"></div>`,
    provider: 'facebook'
  },
  {
    name: 'FacebookReel',
    regex: /(?:https?:\/\/)?(?:www\.)?facebook\.com\/reel\/([0-9]+)/,
    getEmbed: (_id: string, url: string) =>
      `<div class="fb-video" data-href="${url}" data-width="${FB_PLAYER_WIDTH}" data-show-text="false"></div>`,
    provider: 'facebook-reel'
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
        player.innerHTML = pattern.getEmbed?.(this.data.videoId!, this.data.url) || '';
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

    const divider = document.createElement('div');
    divider.className = 'video-upload-divider';
    divider.innerHTML = `<span>or</span>`;

    const urlRow = document.createElement('div');
    urlRow.className = 'video-upload-url-row';

    const urlInput = document.createElement('input');
    urlInput.type = 'text';
    urlInput.className = 'video-upload-url';
    urlInput.placeholder = 'Paste a YouTube, Facebook, TikTok, or Instagram video link here...';

    const loadBtn = document.createElement('button');
    loadBtn.className = 'video-upload-url-btn';
    loadBtn.textContent = 'Load';

    loadBtn.onclick = () => this.handleEmbedURL(urlInput.value.trim());

    urlRow.appendChild(urlInput);
    urlRow.appendChild(loadBtn);

    this.wrapper.appendChild(dropArea);
    this.wrapper.appendChild(this.fileInput);
    this.wrapper.appendChild(divider);
    this.wrapper.appendChild(urlRow);
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      alert('Upload failed');
    }
  }

  private handleEmbedURL(url: string) {
    if (!url) {
      alert('Please enter a video URL');
      return;
    }
    for (const pattern of VIDEO_EMBED_PATTERNS) {
      const match = url.match(pattern.regex);
      if (match) {
        this.data = {
          url,
          type: 'embed',
          provider: pattern.provider,
          videoId: match[1]
        };
        this.renderVideoOnlyPreview();
        return;
      }
    }
    alert('Unsupported video URL or provider.');
  }

  /** Handle provider-specific post-render operations (e.g. SDK, parse) */
  private async mountProviderPlayer(playerDiv: HTMLElement) {
    // Facebook
    if (
      this.data.provider === 'facebook' ||
      this.data.provider === 'facebook-reel'
    ) {
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

  // Define a type for window with optional FB property
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
  /** Actually calls FB.XFBML.parse on the given container */
  private callFBParse(container: HTMLElement) {
    try {
      // @ts-expect-error: FB may not be defined on window, but is injected by Facebook SDK
      if (window.FB && window.FB.XFBML && typeof window.FB.XFBML.parse === 'function') {
        // @ts-expect-error: FB may not be defined on window, but is injected by Facebook SDK
        window.FB.XFBML.parse(container);
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {/* swallow */}
  }

  /** Instagram: try to process embeds */
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