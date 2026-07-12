# ringof.github.io

Source for [ringof.github.io](https://ringof.github.io) — a landing page for
the **RX888 mk2 open-source SDR stack**: firmware (Cypress FX3), Linux host
library and tools (`librx888` / `rx888-tools`), and a GNU Radio 3.10
out-of-tree module (`gr-rx888`).

The page exists to make those three projects discoverable together —
firmware → host library → GNU Radio block — for developers researching the
RX888 / RX888 mk2 direct-sampling HF SDR, the LTC2208 16-bit ADC, or
Cypress FX3 USB 3.0 firmware.

Built with Jekyll (GitHub Pages default), `jekyll-seo-tag`, and
`jekyll-sitemap`.

## Local preview

The site builds with the same [`github-pages`](https://github.com/github/pages-gem)
gem stack GitHub uses, so a local build matches production. To serve it at
<http://localhost:4000>:

```sh
# 1. Ruby + a compiler + headers (Debian/Ubuntu). Skip if you manage Ruby with
#    rbenv/rvm/mise. On macOS: `xcode-select --install` and `brew install ruby`.
sudo apt install -y build-essential ruby ruby-dev zlib1g-dev

# 2. Install gems into a project-local, git-ignored folder — no root needed.
bundle config set --local path vendor/bundle
bundle install

# 3. Serve, with live reload.
bundle exec jekyll serve --livereload
```

Step 2 matters: without `--local path vendor/bundle`, Bundler tries to install
into the system gem directory and fails with a permission error on most Linux
setups.

<details>
<summary>If it still won't build or serve</summary>

- **`Bundler::PermissionError` / "trying to write to `/var/lib/gems/...`"** — you
  skipped the `bundle config` line in step 2. Gems live in `vendor/`
  (git-ignored), so no `sudo` is needed.
- **`mkmf.rb can't find header files for ruby`, or a native gem
  (`bigdecimal`, `ffi`, …) fails to compile** — install the Ruby headers and a
  compiler from step 1 (`ruby-dev`, or the versioned `ruby3.x-dev`, plus
  `build-essential`).
- **`cannot load such file -- webrick`** — you're on Ruby 3.x, which dropped
  WEBrick from stdlib; the `webrick` gem in the `Gemfile` covers it, so re-run
  `bundle install`.

</details>

Changed content and layout live in `_posts/`, `_layouts/`, `index.md`,
`notebook.md`, `tags.md`, and `assets/css/style.css`.
