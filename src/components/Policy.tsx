import { Breadcrumbs } from "./Breadcrumbs";

export function Policy({ title, lede, children }: {
  title: string; lede: string; children: React.ReactNode;
}) {
  return (
    <>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: title }]} />
      <section className="pb-16 pt-2">
        <div className="wrap">
          <h1 className="text-[clamp(34px,4.6vw,54px)]">{title}</h1>
          <p className="mt-2.5 max-w-[60ch] text-[16px] text-muted">{lede}</p>
          <div className="prose-charly mt-7 max-w-[70ch] [&_h3]:mb-2 [&_h3]:mt-7 [&_h3]:font-display [&_h3]:text-[23px]
                          [&_li]:text-muted [&_p]:text-muted [&_ul]:list-disc [&_ul]:pl-5">
            {children}
          </div>
        </div>
      </section>
    </>
  );
}
