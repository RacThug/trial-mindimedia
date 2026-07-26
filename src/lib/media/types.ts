/*
 * The shape of `asset-index.json`, kept away from the file itself so that the
 * pipeline that writes it and the app that reads it can share one definition.
 * `scripts/assets/build.ts` imports these too; without that, the writer and the
 * reader each describe the same JSON and drift apart in silence.
 */

/** A still: an image, or the poster frame standing in for a clip. */
export type MediaImage = {
  readonly src: string
  readonly width: number
  readonly height: number
}

export type MediaVideo = MediaImage & {
  /** Every clip has one. `preload="none"` means this is what a visitor sees. */
  readonly poster: MediaImage
}

export type MediaAsset = MediaImage | MediaVideo
