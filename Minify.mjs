import { readdirSync, readFileSync, writeFileSync, lstatSync } from "node:fs"
import { minify } from 'minify'

async function runMinify(folder) {
  const buildFiles = readdirSync(folder)

  for (const file of buildFiles) {
      if (lstatSync(`${folder}/${file}`).isDirectory()) continue;

      const fileContents = String(readFileSync(`${folder}/${file}`))
      console.log(`Minimizing ${folder}/${file}`)

      if (file.endsWith(".json")) {
        const modifiedContents = fileContents.replace(/(\r\n|\n|\r)/gm,"").replaceAll(" ", "")
        writeFileSync(`${folder}/${file}`, modifiedContents)
      } else if (file.endsWith("html") || file.endsWith("css")) {
        await minify(`${folder}/${file}`)
      }
  }
}

await runMinify("build")
await runMinify("build/static/js")
await runMinify("build/static/css")
process.exit()
