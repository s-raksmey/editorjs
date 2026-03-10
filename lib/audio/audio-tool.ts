import { BlockTool } from '@editorjs/editorjs';
import { audioUploader } from '@/components/editor/EditorUploaders';

interface AudioData {
  url: string;
  name?: string;
  size?: number;
}

export default class AudioTool implements BlockTool {
  private data: AudioData = { url: '' };
  private wrapper: HTMLElement | null = null;
  private fileInput: HTMLInputElement | null = null;

  static get toolbox() {
    return {
      title: 'Audio',
      icon: `
        <svg height="18" width="18" fill="none" viewBox="0 0 24 24" stroke="#f5f5f6" stroke-width="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#f5f5f6" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" stroke="#16d797"/>
        </svg>
      `
    };
  }

  constructor({ data }: { data?: AudioData }) {
    this.data = data || { url: '' };
  }

  render(): HTMLElement {
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'audio-block-wrapper';

    if (this.data.url) {
      this.renderAudioPreview();
    } else {
      this.renderUploadSection();
    }
    return this.wrapper;
  }

  private renderAudioPreview() {
    if (!this.wrapper) return;
    this.wrapper.innerHTML = '';

    const preview = document.createElement('div');
    preview.className = 'audio-file-preview';

    const icon = document.createElement('div');
    icon.className = 'audio-icon';
    icon.innerHTML = `
      <svg width="42" height="42" fill="none" viewBox="0 0 24 24">
        <rect width="16" height="18" x="5" y="3" fill="#f5f5f6" opacity="0.13" rx="3"/>
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="#f5f5f6" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" stroke="#f5f5f6" stroke-width="2"/>
      </svg>
    `;

    const meta = document.createElement('div');
    meta.className = 'audio-meta';
    const fileName = this.data.name || (this.data.url.split('/').pop() || 'audio.mp3');
    const fileSize = this.data.size ? `(${(this.data.size / (1024 * 1024)).toFixed(2)} MB)` : '';
    meta.innerHTML = `
      <div class="audio-filename">${fileName}</div>
      <div class="audio-fileinfo">AUDIO ${fileSize ? `<span class="audio-filesize">${fileSize}</span>` : ''}</div>
    `;

    const actions = document.createElement('div');
    actions.className = 'audio-actions';

    // Player button
    const playBtn = document.createElement('button');
    playBtn.className = 'audio-action-play';
    playBtn.title = 'Play Audio';
    playBtn.innerHTML = `<svg width="22" height="22" fill="#fff" viewBox="0 0 20 20"><path d="M6 4l12 6-12 6V4z"/></svg>`;
    playBtn.onclick = () => {
      let player = preview.querySelector('audio');
      if (!player) {
        player = document.createElement('audio');
        player.src = this.data.url;
        player.controls = true;
        player.style.display = 'block';
        player.style.width = '220px';
        preview.appendChild(player);
        player.play();
        playBtn.style.display = 'none';
      }
    };

    // Replace button
    const replaceBtn = document.createElement('button');
    replaceBtn.className = 'audio-action-replace';
    replaceBtn.title = 'Replace Audio';
    replaceBtn.innerHTML = `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" stroke-width="2">
      <path d="M4 7v13h17V7M12 3v8"/><path d="M1 9h22M16 1h-8v6h8zm-2 2v2"/>
      </svg>Replace`;
    replaceBtn.onclick = () => this.renderUploadSection();

    actions.appendChild(playBtn);
    actions.appendChild(replaceBtn);

    preview.appendChild(icon);
    preview.appendChild(meta);
    preview.appendChild(actions);

    this.wrapper.appendChild(preview);
  }

  private renderUploadSection() {
    if (!this.wrapper) return;
    this.wrapper.innerHTML = '';

    const dropArea = document.createElement('div');
    dropArea.className = 'audio-upload-droparea';
    dropArea.innerHTML = `
      <div class="audio-upload-center">
        <div class="audio-upload-icon">
          <svg width="55" height="55" viewBox="0 0 24 24" fill="none" stroke="#f5f5f6" stroke-width="2">
            <circle cx="12" cy="12" r="10" stroke="#f5f5f6" stroke-width="2" fill="#f5f5f6" opacity="0.11"/>
            <polygon points="10,7 17,12 10,17" fill="#f5f5f6"/>
          </svg>
        </div>
        <div class="audio-upload-title">Upload Audio</div>
        <div class="audio-upload-desc">Drag and drop your audio file here, or click to browse</div>
        <div class="audio-upload-tip">Only audio files up to 10MB are allowed</div>
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
    this.fileInput.accept = 'audio/*';
    this.fileInput.style.display = 'none';
    this.fileInput.onchange = async () => {
      const file = this.fileInput?.files?.[0];
      if (file) await this.handleFile(file);
    };

    this.wrapper.appendChild(dropArea);
    this.wrapper.appendChild(this.fileInput);
  }

  private async handleFile(file: File) {
    if (!file.type.startsWith('audio/')) {
      alert('Only audio files allowed.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File must be less than 10MB.');
      return;
    }
    try {
      const result = await audioUploader(file);
      if (result.success && result.file && result.file.url) {
        this.data.url = result.file.url;
        this.data.name = file.name;
        this.data.size = file.size;
        this.renderAudioPreview();
      } else {
        alert(result.message || 'Upload failed');
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      alert('Upload failed');
    }
  }

  save() {
    return this.data;
  }
  validate(data: AudioData) {
    return !!data.url;
  }
}