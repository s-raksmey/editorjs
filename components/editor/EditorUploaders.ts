// Video uploader for VideoTool
// Accepts a File, uploads it, and returns a result with { success, file: { url }, message }
// You should replace the upload logic with your actual API or storage logic as needed
export async function videoUploader(file: File): Promise<{
	success: boolean;
	file?: { url: string };
	message?: string;
}> {
	try {
		const formData = new FormData();
		formData.append('file', file);
		const res = await fetch('/api/upload', {
			method: 'POST',
			body: formData
		});
		const data = await res.json();
		if (res.ok && data && data.success) {
			return {
				success: true,
				file: {
					url: data.publicUrl || data.file?.url,
				},
			};
		}
		return {
			success: false,
			message: data?.error || 'Upload failed',
		};
	} catch (err) {
		return {
			success: false,
			message: err instanceof Error ? err.message : 'Upload failed',
		};
	}
}
/**
 * Uploads an audio file (e.g., mp3) for Editor.js audio tool
 */
export async function audioUploader(file: File) {
	const formData = new FormData();
	formData.append('file', file);
	try {
		const res = await fetch('/api/upload', {
			method: 'POST',
			body: formData,
		});
		const data = await res.json();
		if (res.ok && data && data.success) {
			return {
				success: 1,
				file: {
					url: data.publicUrl || data.file?.url,
					name: file.name,
					size: file.size,
					title: file.name,
				},
			};
		}
		return {
			success: 0,
			message: data?.error || 'Upload failed',
		};
	} catch (err) {
		return {
			success: 0,
			message: err instanceof Error ? err.message : 'Upload failed',
		};
	}
}
/**
 * Uploads an image, video, or PDF file for Editor.js image tool
 */
export async function imageUploader(file: File) {
	const formData = new FormData();
	formData.append('file', file);
	try {
		const res = await fetch('/api/upload', {
			method: 'POST',
			body: formData,
		});
		const data = await res.json();
		if (res.ok && data && data.success) {
			return {
				success: 1,
				file: {
					url: data.publicUrl || data.file?.url,
					name: file.name,
					size: file.size,
					title: file.name,
				},
			};
		}
		return {
			success: 0,
			message: data?.error || 'Upload failed',
		};
	} catch (err) {
		return {
			success: 0,
			message: err instanceof Error ? err.message : 'Upload failed',
		};
	}
}

/**
 * Uploads any file (image, video, PDF, etc.) for Editor.js attaches tool
 */
export async function attachesUploader(file: File) {
	const formData = new FormData();
	formData.append('file', file);
	try {
		const res = await fetch('/api/upload', {
			method: 'POST',
			body: formData,
		});
		const data = await res.json();
		if (res.ok && data && data.success) {
			return {
				success: 1,
				file: {
					url: data.publicUrl || data.file?.url,
					name: file.name,
					size: file.size,
					title: file.name,
				},
			};
		}
		return {
			success: 0,
			message: data?.error || 'Upload failed',
		};
	} catch (err) {
		return {
			success: 0,
			message: err instanceof Error ? err.message : 'Upload failed',
		};
	}
}
