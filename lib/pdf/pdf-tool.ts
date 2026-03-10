import { BlockTool } from "@editorjs/editorjs";
import { attachesUploader } from "@/components/editor/EditorUploaders";

interface PDFData {
  url: string;
  name?: string;
  size?: number;
}

export default class PDFTool implements BlockTool {
  private data: PDFData = { url: "" };
  private wrapper: HTMLElement | null = null;
  private fileInput: HTMLInputElement | null = null;
  private dropArea: HTMLElement | null = null;

  static get toolbox() {
    return {
      title: "PDF",
      icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14,2 14,8 20,8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10,9 9,9 8,9"></polyline>
      </svg>`,
    };
  }

  constructor({ data }: { data?: PDFData }) {
    this.data = data || { url: "" };
  }

  render(): HTMLElement {
    this.wrapper = document.createElement("div");
    this.wrapper.className = "pdf-block-wrapper";

    if (this.data.url) {
      this.renderFilePreview();
    } else {
      this.renderUploadSection();
    }
    return this.wrapper;
  }

  /** Preview file (as Image 2) */
  private renderFilePreview() {
    if (!this.wrapper) return;
    this.wrapper.innerHTML = "";

    // Container
    const preview = document.createElement("div");
    preview.className = "pdf-file-preview";

    // Icon
    const icon = document.createElement("div");
    icon.className = "pdf-icon";
    icon.innerHTML = `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14,2 14,8 20,8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
        <polyline points="10,9 9,9 8,9"></polyline>
      </svg>`;
    // Text info
    const meta = document.createElement("div");
    meta.className = "pdf-meta";
    const fileName =
      this.data.name || this.data.url.split("/").pop() || "PDF file";
    const fileSize = this.data.size
      ? `(${(this.data.size / (1024 * 1024)).toFixed(2)} MB)`
      : "";
    meta.innerHTML = `
      <div class="pdf-filename">${fileName}</div>
      <div class="pdf-fileinfo">PDF 
      ${fileSize ? `&nbsp; <span class="pdf-filesize">${fileSize}</span>` : ""}</div>
    `;

    // Actions (view, replace)
    const actions = document.createElement("div");
    actions.className = "pdf-actions";

    const viewBtn = document.createElement("button");
    viewBtn.className = "pdf-action-view";
    viewBtn.title = "View PDF";
    viewBtn.innerHTML = `<svg width="22" height="22" fill="none" viewBox="0 0 20 20"><path fill="#fff" d="M10 4C6 4 2.73 7.11 2.08 8.05a1.25 1.25 0 000 1.9C2.73 12.9 6 16 10 16c4 0 7.27-3.11 7.92-4.05a1.25 1.25 0 000-1.9C17.27 7.1 14 4 10 4zm0 10c-2.93 0-5.87-2.53-6.74-3.5.87-.97 3.81-3.5 6.74-3.5s5.87 2.53 6.74 3.5c-.87.97-3.81 3.5-6.74 3.5zm0-5a1.5 1.5 0 100 3 1.5 1.5 0 000-3z"/></svg>`;
    viewBtn.onclick = () => window.open(this.data.url, "_blank");

    const replaceBtn = document.createElement("button");
    replaceBtn.className = "pdf-action-replace";
    replaceBtn.title = "Replace PDF";
    replaceBtn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M4 7v13h17V7M12 3v8"/><path d="M1 9h22M16 1h-8v6h8zm-2 2v2"/></svg>Replace`;
    replaceBtn.onclick = () => this.renderUploadSection();

    actions.appendChild(viewBtn);
    actions.appendChild(replaceBtn);

    preview.appendChild(icon);
    preview.appendChild(meta);
    preview.appendChild(actions);

    this.wrapper.appendChild(preview);
  }

  /** File upload UI (as Image 1) */
  private renderUploadSection() {
    if (!this.wrapper) return;
    this.wrapper.innerHTML = "";

    // Drag/drop area
    const dropArea = document.createElement("div");
    dropArea.className = "pdf-upload-droparea";
    dropArea.innerHTML = `
      <div class="pdf-upload-center">
        <div class="pdf-upload-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10,9 9,9 8,9"></polyline>
            </svg>
        </div>
        <div class="pdf-upload-title">Upload PDF</div>
        <div class="pdf-upload-desc">Drag and drop your PDF file here, or click to browse</div>
        <div class="pdf-upload-tip">Only PDF files up to 20MB are allowed</div>
      </div>
    `;

    dropArea.onclick = () => this.fileInput?.click();

    // Drag/drop interaction
    dropArea.ondragover = (e) => {
      e.preventDefault();
      dropArea.classList.add("is-over");
    };
    dropArea.ondragleave = () => dropArea.classList.remove("is-over");
    dropArea.ondrop = async (e) => {
      e.preventDefault();
      dropArea.classList.remove("is-over");
      const file = (e.dataTransfer?.files && e.dataTransfer.files[0]) || null;
      if (file) await this.handleFile(file);
    };

    // Hidden file input
    this.fileInput = document.createElement("input");
    this.fileInput.type = "file";
    this.fileInput.accept = "application/pdf";
    this.fileInput.style.display = "none";
    this.fileInput.onchange = async () => {
      const file = this.fileInput?.files?.[0];
      if (file) await this.handleFile(file);
    };

    // Compose all in wrapper
    this.wrapper.appendChild(dropArea);
    this.wrapper.appendChild(this.fileInput);
  }

  /** File upload logic + metadata */
  private async handleFile(file: File) {
    if (file.type !== "application/pdf") {
      alert("Only PDF files allowed");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      alert("File exceeds 20MB limit.");
      return;
    }
    // Optionally show loading
    try {
      const result = await attachesUploader(file);
      if (result.success && result.file && result.file.url) {
        this.data.url = result.file.url;
        this.data.name = file.name;
        this.data.size = file.size;
        this.renderFilePreview();
      } else {
        alert(result.message || "Upload failed");
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      alert("Upload failed");
    }
  }

  save() {
    return this.data;
  }
  validate(data: PDFData) {
    return !!data.url;
  }
}
