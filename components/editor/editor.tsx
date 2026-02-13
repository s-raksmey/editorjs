"use client";

import React, { useEffect, useRef } from 'react';
import EditorJS, { type OutputData } from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Quote from '@editorjs/quote';
import ImageTool from '@editorjs/image';
import CodeTool from '@editorjs/code';
import InlineCode from '@editorjs/inline-code';
import Embed from '@editorjs/embed';
import Attaches from '@editorjs/attaches';
import LinkTool from '@editorjs/link';

import { imageUploader, attachesUploader } from './EditorUploaders';

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
					data,
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
								types: 'image/*',
							},
						},
						pdf: {
							class: Attaches,
							toolbox: {
								title: 'PDF',
								icon: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
									<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
									<polyline points="14,2 14,8 20,8"></polyline>
									<line x1="16" y1="13" x2="8" y2="13"></line>
									<line x1="16" y1="17" x2="8" y2="17"></line>
									<polyline points="10,9 9,9 8,9"></polyline>
								</svg>`,
							},
							config: {
								uploader: {
									uploadByFile: attachesUploader,
								},
								types: 'application/pdf',
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
				});

				if (!isDestroyed) {
					editorRef.current = editor;
				}
			} catch (error) {
				console.error('Failed to initialize editor:', error);
			}
		};

		initializeEditor();

		return () => {
			isDestroyed = true;
			if (editorRef.current && typeof editorRef.current.destroy === 'function') {
				editorRef.current.destroy();
			}
			editorRef.current = null;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [onChange]);

	return <div ref={holder} className="editorjs" />;
};
