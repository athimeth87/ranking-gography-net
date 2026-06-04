'use server';

import { cookies } from 'next/headers';

export async function setLocale(locale: 'en' | 'th') {
  cookies().set('NEXT_LOCALE', locale, { path: '/' });
}
