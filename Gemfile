source "https://rubygems.org"

# Matches the github-pages gem stack so local builds match what GitHub builds.
gem "github-pages", group: :jekyll_plugins

group :jekyll_plugins do
  gem "jekyll-seo-tag"
  gem "jekyll-sitemap"
end

# Ruby 3.0+ dropped WEBrick from the standard library, and the github-pages
# stack's Jekyll 3.x uses it for `jekyll serve`. Needed for local preview only;
# the GitHub Pages build doesn't use it.
gem "webrick", "~> 1.8"
