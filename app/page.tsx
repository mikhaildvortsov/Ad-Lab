import { redirect } from 'next/navigation'
import { defaultLocale } from '@/lib/i18n'

export default async function RootPage() {
  redirect(`/${defaultLocale}`)
}
