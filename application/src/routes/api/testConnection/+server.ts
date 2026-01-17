import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { connectDB } from '$lib/database';

export const GET: RequestHandler = async () => {
	try {
		await connectDB();
		return json({ ok: true });
	} catch (err) {
		console.error('DB connection failed:', err);
		return json(
			{ ok: false, name: (err as any)?.name, message: (err as any)?.message },
			{ status: 500 }
		);
	}
};
