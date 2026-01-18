import mongoose, { Schema, model } from 'mongoose';
import type { IPreset } from './Preset';

export interface IPhoto {
	photoId: string;
	file: Buffer;
	changes: IPreset;
}

const photoSchema = new Schema<IPhoto>(
	{
		photoId: {
			type: String,
			required: true,
			unique: true,
			index: true
		},
		file: {
			type: Buffer,
			required: true
		},
		changes: {
			basic: {
				brightness: {
					type: Number,
					default: 0
				},
				contrast: {
					type: Number,
					default: 0
				},
				highlight: {
					type: Number,
					default: 0
				},
				shadow: {
					type: Number,
					default: 0
				}
			},
			color: {
				temperature: {
					type: Number,
					default: 0
				},
				tint: {
					type: Number,
					default: 0
				},
				vibrance: {
					type: Number,
					default: 0
				},
				saturation: {
					type: Number,
					default: 0
				}
			},
			hsl: {
				red: {
					hue: {
						type: Number,
						default: 0
					},
					saturation: {
						type: Number,
						default: 0
					},
					luminance: {
						type: Number,
						default: 0
					}
				},
				orange: {
					hue: {
						type: Number,
						default: 0
					},
					saturation: {
						type: Number,
						default: 0
					},
					luminance: {
						type: Number,
						default: 0
					}
				},
				yellow: {
					hue: {
						type: Number,
						default: 0
					},
					saturation: {
						type: Number,
						default: 0
					},
					luminance: {
						type: Number,
						default: 0
					}
				},
				green: {
					hue: {
						type: Number,
						default: 0
					},
					saturation: {
						type: Number,
						default: 0
					},
					luminance: {
						type: Number,
						default: 0
					}
				},
				cyan: {
					hue: {
						type: Number,
						default: 0
					},
					saturation: {
						type: Number,
						default: 0
					},
					luminance: {
						type: Number,
						default: 0
					}
				},
				blue: {
					hue: {
						type: Number,
						default: 0
					},
					saturation: {
						type: Number,
						default: 0
					},
					luminance: {
						type: Number,
						default: 0
					}
				},
				purple: {
					hue: {
						type: Number,
						default: 0
					},
					saturation: {
						type: Number,
						default: 0
					},
					luminance: {
						type: Number,
						default: 0
					}
				},
				magenta: {
					hue: {
						type: Number,
						default: 0
					},
					saturation: {
						type: Number,
						default: 0
					},
					luminance: {
						type: Number,
						default: 0
					}
				}
			},
			lens_corrections: {
				distortion: {
					type: Number,
					default: 0
				},
				chromatic_aberration: {
					type: Number,
					default: 0
				},
				vignetting: {
					type: Number,
					default: 0
				}
			},
			transform: {
				rotate: {
					type: Number,
					default: 0
				},
				vertical: {
					type: Number,
					default: 0
				},
				horizontal: {
					type: Number,
					default: 0
				},
				perspective: {
					type: Number,
					default: 0
				}
			}
		}
	},
	{
		timestamps: true
	}
);

export const Photo = mongoose.models.Photo || model<IPhoto>('Photo', photoSchema);
