import { readdirSync, readFileSync, writeFileSync, lstatSync } from "node:fs"
import { minify } from 'minify'

function runMinify(folder) {
  const buildFiles = readdirSync(folder)
  buildFiles.forEach(async (file) => {
    if (lstatSync(`${folder}/${file}`).isDirectory()) return
    const fileContents = String(readFileSync(`${folder}/${file}`))
    console.log(`Minimizing ${folder}/${file}`)

    if (file.endsWith(".json")) {
      const modifiedContents = fileContents.replace(/(\r\n|\n|\r)/gm,"").replaceAll(" ", "")
      writeFileSync(`${folder}/${file}`, modifiedContents)
    } else if (file.endsWith("html") || file.endsWith("js") || file.endsWith("css")) {
      await minify(`${folder}/${file}`)
    }
  })
}

runMinify("build")
runMinify("build/static/js")
runMinify("build/static/css")
