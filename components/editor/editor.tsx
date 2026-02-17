"use client";

import React, { useEffect, useRef } from "react";
import EditorJS, { type OutputData } from "@editorjs/editorjs";
import Header from "@editorjs/header";
import List from "@editorjs/list";
import Quote from "@editorjs/quote";
import ImageTool from "@editorjs/image";
import CodeTool from "@editorjs/code";
import InlineCode from "@editorjs/inline-code";
import Embed from "@editorjs/embed";
import LinkTool from "@editorjs/link";
import AudioTool from "@/lib/audio/audio-tool";
import PDFTool from "@/lib/pdf/pdf-tool";
import VideoTool from "@/lib/video/video-tool";
import Undo from "editorjs-undo";

import {
  imageUploader,
  attachesUploader,
  audioUploader,
  videoUploader,
} from "./EditorUploaders";

interface EditorProps {
  data?: OutputData;
  onChange?: (data: OutputData) => void;
}

export const Editor: React.FC<EditorProps> = ({ data, onChange }) => {
  const editorRef = useRef<EditorJS | null>(null);
  const holder = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (!holder.current) return;

    let isDestroyed = false;

    const initializeEditor = async () => {
      try {
        if (isDestroyed) return;

        const editor = new EditorJS({
          holder: holder.current!,
          data: data && Array.isArray(data.blocks) ? data : { blocks: [] },
          autofocus: true,
          tools: {
            header: Header,
            list: List,
            quote: Quote,
            code: CodeTool,
            inlineCode: InlineCode,
            embed: Embed,
            linkTool: LinkTool,
            image: {
              class: ImageTool,
              config: {
                uploader: {
                  uploadByFile: imageUploader,
                },
                types: "image/*",
              },
            },
            pdf: {
              class: PDFTool,
              config: {
                uploader: {
                  uploadByFile: attachesUploader,
                },
                types: "application/pdf",
              },
            },
            audio: {
              class: AudioTool,
              config: {
                uploader: {
                  uploadByFile: audioUploader,
                },
                types: "audio/*",
              },
            },
            video: {
              class: VideoTool,
              config: {
                uploader: {
                  uploadByFile: videoUploader,
                },
                types: "video/*",
              },
            },
          },
          onChange: async () => {
            if (editorRef.current) {
              const output = await editorRef.current.save();
              if (output) {
                onChange?.(output);
              }
            }
          },
          onReady: () => {
            new Undo({ editor });
          },
        });

        if (!isDestroyed) {
          editorRef.current = editor;
        }
      } catch (error) {
        console.error("Failed to initialize editor:", error);
      }
    };

    initializeEditor();

    return () => {
      isDestroyed = true;
      if (
        editorRef.current &&
        typeof editorRef.current.destroy === "function"
      ) {
        editorRef.current.destroy();
      }
      editorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onChange]);

  return <div ref={holder} className="editorjs" />;
};
