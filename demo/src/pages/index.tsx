import Layout from '@theme/Layout'

export default function Home() {
  return (
    <Layout
      title="Home"
      description="A Docusaurus site demonstrating generated OpenGraph images."
    >
      <main className="container margin-vert--lg">
        <h1>Docusaurus OG Demo</h1>
        <p>
          This page, its documentation pages, and its blog posts receive
          generated OpenGraph images during the site build.
        </p>
        <p>
          Browse the <a href="/docs/intro">documentation example</a> and the{' '}
          <a href="/blog/first-post">blog post example</a>.
        </p>
      </main>
    </Layout>
  )
}
