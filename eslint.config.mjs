import { dirname } from "path"
import { fileURLToPath } from "url"
import { FlatCompat } from "@eslint/eslintrc"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "src/data/papers.ts",
      "src/server/key-files.ts",
    ],
  },
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "**/server/keys/**",
                "@/server/keys",
                "@/server/keys/**",
                "@/server/key-files",
                "**/answer-keys.json",
              ],
              message:
                "Answer keys are server-only. Load them through src/server/load-key.ts from a server action.",
            },
          ],
        },
      ],
    },
  },
]

export default eslintConfig
