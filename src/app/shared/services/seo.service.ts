import { Injectable } from "@angular/core"
import { Title, Meta } from "@angular/platform-browser"

export interface SEOData {
  title?: string
  description?: string
  keywords?: string
  image?: string
  url?: string
  type?: string
  author?: string
  publishedTime?: string
  modifiedTime?: string
  canonical?: string
}

@Injectable({
  providedIn: "root",
})
export class SEOService {
  constructor(
    private titleService: Title,
    private metaService: Meta,
  ) {}

  updateSEO(data: SEOData): void {
    if (data.title) {
      this.titleService.setTitle(`${data.title} | Privium`)
    }

    if (data.description) {
      this.updateMetaTag("description", data.description)
      this.updateMetaTag("og:description", data.description, "property")
      this.updateMetaTag("twitter:description", data.description)
    }

    if (data.keywords) {
      this.updateMetaTag("keywords", data.keywords)
    }

    if (data.image) {
      this.updateMetaTag("og:image", data.image, "property")
      this.updateMetaTag("twitter:image", data.image)
    }

    if (data.url) {
      this.updateMetaTag("og:url", data.url, "property")
    }

    if (data.type) {
      this.updateMetaTag("og:type", data.type, "property")
    }

    if (data.author) {
      this.updateMetaTag("author", data.author)
    }

    if (data.publishedTime) {
      this.updateMetaTag("article:published_time", data.publishedTime, "property")
    }

    if (data.modifiedTime) {
      this.updateMetaTag("article:modified_time", data.modifiedTime, "property")
    }

    if (data.canonical) {
      this.updateCanonicalLink(data.canonical)
    }

    if (data.title) {
      this.updateMetaTag("og:title", `${data.title} | Privium`, "property")
      this.updateMetaTag("twitter:title", `${data.title} | Privium`)
    }
  }

  private updateMetaTag(name: string, content: string, attribute = "name"): void {
    const selector = `${attribute}="${name}"`
    const existingTag = this.metaService.getTag(selector)

    if (existingTag) {
      this.metaService.updateTag({ [attribute]: name, content })
    } else {
      this.metaService.addTag({ [attribute]: name, content })
    }
  }

  addStructuredData(data: any): void {
    const script = document.createElement("script")
    script.type = "application/ld+json"
    script.text = JSON.stringify(data)
    document.head.appendChild(script)
  }

  removeStructuredData(): void {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]')
    scripts.forEach((script) => script.remove())
  }

  private updateCanonicalLink(url: string): void {
    let link = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null
    if (link) {
      link.href = url
    } else {
      link = document.createElement("link")
      link.setAttribute("rel", "canonical")
      link.href = url
      document.head.appendChild(link)
    }
  }
}
