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
        // Старый UA → Google Fonts возвращает TTF (satori не поддерживает woff2)
        "User-Agent": "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1)",
      },
    }).then((r) => r.text())

    const match = css.match(/src: url\((.+?)\) format\('woff2'\)/)
    if (!match) return undefined

    return fetch(match[1]).then((r) => r.arrayBuffer())
  } catch {
    return undefined
  }
}
