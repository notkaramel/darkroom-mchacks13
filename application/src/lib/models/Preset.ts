/**
 * Preset/Set of changes made to the photo
 * This is different from "changes" object on Photo
 * Since the app is not made for raw photo yet,
 * most data values below will be relative values
 */

import mongoose, { Schema, model } from 'mongoose';

export interface IPreset {
	basic: {
		brightness: Number;
		contrast: Number;
		highlight: Number;
		shadow: Number;
	};
	color: {
		temperature: Number;
		tint: Number;
		vibrance: Number;
		saturation: Number;
	};
	hsl: {
		red: {
			hue: Number;
			saturation: Number;
			luminance: Number;
		};
		orange: {
			hue: Number;
			saturation: Number;
			luminance: Number;
		};
		yellow: {
			hue: Number;
			saturation: Number;
			luminance: Number;
		};
		green: {
			hue: Number;
			saturation: Number;
			luminance: Number;
		};
		cyan: {
			hue: Number;
			saturation: Number;
			luminance: Number;
		};
		blue: {
			hue: Number;
			saturation: Number;
			luminance: Number;
		};
		purple: {
			hue: Number;
			saturation: Number;
			luminance: Number;
		};
		magenta: {
			hue: Number;
			saturation: Number;
			luminance: Number;
		};
	};
	lens_corrections: {
		distortion: Number;
		chromatic_aberration: Number;
		vignetting: Number;
	};
	transform: {
		rotate: Number;
		vertical: Number;
		horizontal: Number;
		perspective: Number;
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
