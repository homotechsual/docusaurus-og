import React from 'react'
import Link from '@docusaurus/Link'
import useDocusaurusContext from '@docusaurus/useDocusaurusContext'
import Layout from '@theme/Layout'
import Heading from '@theme/Heading'
import packageInfo from '../../../package.json'
import GeneratedImage from '../components/GeneratedImage'
import styles from './index.module.css'

const features = [
  {
    title: 'Images made for your content',
    description: 'Generate individual social previews for docs, blog posts, and pages as part of your site build.',
  },
  {
    title: 'Your design, your renderer',
    description: 'Use React elements and Satori styles to choose the layout, typography, and colors for each content type.',
  },
  {
    title: 'Bring your own background',
    description: 'Add a local PNG, JPEG, or simple SVG as the backdrop for your image.',
  },
  {
    title: 'Ready to share',
    description: 'The plugin writes the generated PNGs and adds OpenGraph image metadata to your built pages.',
  },
]

function GeneratedPreview() {
  return (
    <section className={`container ${styles.preview}`}>
      <Heading as="h2" id="generated-example">See a generated image</Heading>
      <p>
        This is the OpenGraph image generated for this page, using the custom
        background image described in the documentation.
      </p>
      <GeneratedImage
        imageClassName={styles.previewImage}
        alt="Generated social preview for the Docusaurus OG homepage"
      />
      <p>
        <Link to="/docs/backgrounds">Learn how to use a custom background →</Link>
      </p>
    </section>
  )
}

export default function Home(): React.JSX.Element {
  const { siteConfig } = useDocusaurusContext()

  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <header className={`hero hero--primary ${styles.hero}`}>
        <div className="container">
          <Heading as="h1" className="hero__title">{siteConfig.title}</Heading>
          <p className="hero__subtitle">{siteConfig.tagline}</p>
          <div className={styles.buttons}>
            <Link className="button button--secondary button--lg" to="#generated-example">
              See the Demo →
            </Link>
            <Link className="button button--outline button--secondary button--lg" to="/docs/intro">
              Read the Docs
            </Link>
          </div>
          <p className="padding-top--md margin-bottom--none">
            <Link className="button button--outline button--secondary button--sm" to="https://github.com/homotechsual/docusaurus-og/releases/latest">
              Current release: v{packageInfo.version}
            </Link>
          </p>
        </div>
      </header>
      <main>
        <section className={styles.features} aria-label="Docusaurus OG features">
          <div className="container">
            <div className="row">
              {features.map(({ title, description }) => (
                <div key={title} className="col col--3">
                  <div className="padding-horiz--md">
                    <Heading as="h3">{title}</Heading>
                    <p>{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <GeneratedPreview />
      </main>
    </Layout>
  )
}
