import { useEffect, useState } from 'react'
import { useContent } from '@/app/ContentProvider'
import { cn } from '@/utils'

/**
 * The official RAGBOOMS logo, loaded from Settings → Logo (default: /brand/logo.png).
 *
 * The supplied artwork is a wide wordmark centred on a square canvas, so the
 * image is shown in a 3:1 frame with `object-cover`, which trims the empty
 * space above and below without altering the artwork. Set `trim={false}` for
 * a logo file that is already cropped.
 *
 * If the file is missing, a plain text wordmark is shown so the layout never
 * breaks — that fallback is a stand-in, not the logo.
 */
export function Logo({ className, width = 132 }: { className?: string; width?: number }) {
  const { settings } = useContent().content
  const src = settings.general.logo_url || '/brand/logo.png'
  const [state, setState] = useState<'loading' | 'ok' | 'missing'>('loading')
  const [square, setSquare] = useState(true)

  useEffect(() => {
    setState('loading')
    const img = new Image()
    img.onload = () => {
      setSquare(img.naturalWidth / img.naturalHeight < 1.6)
      setState('ok')
    }
    img.onerror = () => setState('missing')
    img.src = src
  }, [src])

  if (state === 'missing')
    return (
      <span
        className={cn('font-display font-bold uppercase tracking-[0.18em] text-hi', className)}
        style={{ fontSize: width / 7.2 }}
        title="Logo file not found — add public/brand/logo.png or set one in Admin → Settings"
      >
        Ragbooms
      </span>
    )

  return (
    <span
      className={cn('inline-block overflow-hidden align-middle', className)}
      style={{ width, height: square ? width / 3 : 'auto', opacity: state === 'ok' ? 1 : 0 }}
    >
      <img
        src={src}
        alt="RAGBOOMS"
        width={width}
        className={cn('block w-full', square ? 'h-full object-cover object-center' : 'h-auto')}
        draggable={false}
      />
    </span>
  )
}
