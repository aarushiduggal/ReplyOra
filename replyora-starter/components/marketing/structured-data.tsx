import {
  FOUNDER,
  IG_URL,
  ORG_DESCRIPTION,
  ORG_NAME,
  SITE_URL,
} from "@/lib/site";

/**
 * Site-wide JSON-LD: Organization (with founder), the founder Person, and the
 * WebSite. Helps search + social show the brand and founder consistently.
 */
export function StructuredData() {
  const org = {
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: ORG_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/opengraph-image`,
    description: ORG_DESCRIPTION,
    areaServed: "AU",
    sameAs: [IG_URL],
    founder: {
      "@type": "Person",
      "@id": `${SITE_URL}/#founder`,
    },
  };

  const person = {
    "@type": "Person",
    "@id": `${SITE_URL}/#founder`,
    name: FOUNDER.name,
    jobTitle: FOUNDER.jobTitle,
    worksFor: { "@id": `${SITE_URL}/#organization` },
    image: `${SITE_URL}${FOUNDER.photo}`,
    url: SITE_URL,
    sameAs: [IG_URL],
  };

  const website = {
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: ORG_NAME,
    publisher: { "@id": `${SITE_URL}/#organization` },
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [org, person, website],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
