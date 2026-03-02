/**
 * Загружает Inter с Google Fonts с text-субсеттингом.
 * Возвращает ArrayBuffer для передачи в ImageResponse (next/og / satori).
 * Работает с кириллицей — Google Fonts создаёт subsetted шрифт по переданному тексту.
 */
export async function loadOgFont(
  text: string,
  weight: 400 | 600 | 700 = 700
): Promise<ArrayBuffer | undefined> {
  const url =
    `https://fonts.googleapis.com/css2?family=Inter:wght@${weight}` +
    `&text=${encodeURIComponent(text)}`

  try {
    const css = await fetch(url, {
      headers: {
        // Chrome UA — чтобы Google Fonts вернул woff2 (а не woff/ttf)
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    }).then((r) => r.text())

    const match = css.match(/src: url\((.+?)\) format\('woff2'\)/)
    if (!match) return undefined

    return fetch(match[1]).then((r) => r.arrayBuffer())
  } catch {
    return undefined
  }
}
