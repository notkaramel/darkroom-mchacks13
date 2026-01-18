import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { connectDB } from '$lib/database';

export const GET: RequestHandler = async () => {
	try {
		await connectDB();
		return json({ ok: true });
	} catch (err) {
		console.error('DB connection failed:', err);
		const error = err instanceof Error ? err : new Error('Unknown error');
		return json(
			{ ok: false, name: error.name, message: error.message },
			{ status: 500 }
		);
	}
};
