import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import mongoose from 'mongoose';

import { connectDB } from '$lib/database';
import { User } from '$lib/models/User';

function isObjectId(value: string) {
	return mongoose.Types.ObjectId.isValid(value);
}

// For GET (lean object, faster, no .save())
async function findUserLean(userId: string) {
	if (isObjectId(userId)) {
		return User.findById(userId).lean();
	}
	return User.findOne({ username: userId }).lean();
}

// For PUT (real document, allows .save())
async function findUserDoc(userId: string) {
	if (isObjectId(userId)) {
		return User.findById(userId);
	}
	return User.findOne({ username: userId });
}

export const GET: RequestHandler = async ({ params }) => {
	try {
		await connectDB();

		const { userId } = params;
		if (!userId) {
			return json({ error: 'Missing userId' }, { status: 400 });
		}

		const user = await findUserLean(userId);
		if (!user) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		return json(
			{
				_id: user._id,
				username: user.username,
				photos: user.photos ?? []
			},
			{ status: 200 }
		);
	} catch (err) {
		console.error('GET /api/user error:', err);
		return json({ error: 'Server error' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ params, request }) => {
	try {
		await connectDB();

		const { userId } = params;
		if (!userId) {
			return json({ error: 'Missing userId' }, { status: 400 });
		}

		const user = await findUserDoc(userId);
		if (!user) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		const body = await request.json().catch(() => ({}));

		// 1) Replace all photo IDs
		if (Array.isArray(body.photoIds)) {
			user.photos = body.photoIds.map(String);
			await user.save();

			return json(
				{
					_id: user._id,
					username: user.username,
					photos: user.photos
				},
				{ status: 200 }
			);
		}

		// 2) Add one photo ID
		if (typeof body.addPhotoId === 'string') {
			const pid = body.addPhotoId;

			if (!user.photos.includes(pid)) {
				user.photos.push(pid);
				await user.save();
			}

			return json(
				{
					_id: user._id,
					username: user.username,
					photos: user.photos
				},
				{ status: 200 }
			);
		}

		// 3) Remove one photo ID
		if (typeof body.removePhotoId === 'string') {
			const pid = body.removePhotoId;
			user.photos = user.photos.filter((id: string) => id !== pid);
			await user.save();

			return json(
				{
					_id: user._id,
					username: user.username,
					photos: user.photos
				},
				{ status: 200 }
			);
		}

		return json(
			{
				error:
					'Invalid body. Use {photoIds:[]}, {addPhotoId:"..."}, or {removePhotoId:"..."}'
			},
			{ status: 400 }
		);
	} catch (err) {
		console.error('PUT /api/user error:', err);
		return json({ error: 'Server error' }, { status: 500 });
	}
};
