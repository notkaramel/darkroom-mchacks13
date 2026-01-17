import mongoose from 'mongoose';
import { MONGO_USERNAME, MONGO_PASSWORD } from '$env/static/private';
import { Preset } from '$lib/models/Preset';
import { json, type RequestHandler } from '@sveltejs/kit';

const uri = `mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}@darkroom-cluster.ffcj3de.mongodb.net/?appName=darkroom-cluster`;

async function connectDB() {
	if (mongoose.connection.readyState === 0) {
		await mongoose.connect(uri);
	}
}

export const GET: RequestHandler = async ({ url }) => {
	try {
		await connectDB();
		const action = url.searchParams.get('action');
		const presetId = url.searchParams.get('id');

		// Create preset endpoint
		if (action === 'create' || (!action && !presetId)) {
			const testPreset = new Preset({
				basic: {
					brightness: 10,
					contrast: 5,
					highlight: -5,
					shadow: 10
				},
				color: {
					temperature: 0,
					tint: 0,
					vibrance: 0,
					saturation: 0
				},
				hsl: {
					red: { hue: 0, saturation: 0, luminance: 0 },
					orange: { hue: 0, saturation: 0, luminance: 0 },
					yellow: { hue: 0, saturation: 0, luminance: 0 },
					green: { hue: 0, saturation: 0, luminance: 0 },
					cyan: { hue: 0, saturation: 0, luminance: 0 },
					blue: { hue: 0, saturation: 0, luminance: 0 },
					purple: { hue: 0, saturation: 0, luminance: 0 },
					magenta: { hue: 0, saturation: 0, luminance: 0 }
				},
				lens_corrections: {
					distortion: 0,
					chromatic_aberration: 0,
					vignetting: 0
				},
				transform: {
					rotate: 0,
					vertical: 0,
					horizontal: 0,
					perspective: 0
				}
			});

			const savedPreset = await testPreset.save();
			return json(
				{
					message: 'Preset created successfully',
					preset: savedPreset
				},
				{ status: 201 }
			);
		}

		// Delete preset endpoint
		if (action === 'delete' || presetId) {
			if (!presetId) {
				return json({ error: 'Preset ID is required for deletion' }, { status: 400 });
			}

			const deletedPreset = await Preset.findByIdAndDelete(presetId);

			if (!deletedPreset) {
				return json({ error: 'Preset not found' }, { status: 404 });
			}

			return json(
				{
					message: 'Preset deleted successfully',
					preset: deletedPreset
				},
				{ status: 200 }
			);
		}

		return json({ error: 'Invalid action. Use ?action=create or ?action=delete&id=<presetId>' }, { status: 400 });
	} catch (error) {
		console.error('Error in test preset endpoint:', error);
		return json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
	}
};
