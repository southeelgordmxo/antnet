import { AntNet } from '@/components/sites/antnet/antnet';
export function generateStaticParams() { return ['crawlers','queen','treasury','mint','order','man','library'].map(section => ({ section })); }
export const dynamicParams = false;
export default async function Page({ params }: { params: Promise<{ section: string }> }) { const { section } = await params; return <AntNet view={section} />; }

