/**
 * Preset/Set of changes made to the photo
 * This is different from "changes" object on Photo
 * Since the app is not made for raw photo yet,
 * most data values below will be relative values
 */

import mongoose, { Schema, model } from 'mongoose';

export interface IPreset {
	basic: {
		brightness: number;
		contrast: number;
		highlight: number;
		shadow: number;
	};
	color: {
		temperature: number;
		tint: number;
		vibrance: number;
		saturation: number;
	};
	hsl: {
		red: {
			hue: number;
			saturation: number;
			luminance: number;
		};
		orange: {
			hue: number;
			saturation: number;
			luminance: number;
		};
		yellow: {
			hue: number;
			saturation: number;
			luminance: number;
		};
		green: {
			hue: number;
			saturation: number;
			luminance: number;
		};
		cyan: {
			hue: number;
			saturation: number;
			luminance: number;
		};
		blue: {
			hue: number;
			saturation: number;
			luminance: number;
		};
		purple: {
			hue: number;
			saturation: number;
			luminance: number;
		};
		magenta: {
			hue: number;
			saturation: number;
			luminance: number;
		};
	};
	lens_corrections: {
		distortion: number;
		chromatic_aberration: number;
		vignetting: number;
	};
	transform: {
		rotate: number;
		vertical: number;
		horizontal: number;
		perspective: number;
	};
}

const presetSchema = new Schema<IPreset>(
	{
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
	},
	{
		timestamps: true
	}
);

export const Preset = mongoose.models.Preset || model<IPreset>('Preset', presetSchema);
