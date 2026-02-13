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
