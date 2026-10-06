'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRightIcon, UsersIcon } from './icons';
import { getActiveGroupCode } from '@/lib/groupOrder';
export function GroupOrderBanner({ restaurantId, contextQuery }: { restaurantId:string; contextQuery:string }) {
 const [groupCode,setGroupCode]=useState<string|null>(null); const [ready,setReady]=useState(false);
 useEffect(()=>{setGroupCode(getActiveGroupCode(restaurantId));setReady(true)},[restaurantId]);
 if(!ready) return null;
 const href=groupCode?`/menu/${restaurantId}/group/${groupCode}${contextQuery}`:`/menu/${restaurantId}/group${contextQuery}`;
 return <Link href={href} className="group flex items-center gap-3 rounded-[28px] bg-[#171514] px-4 py-3.5 text-white shadow-[0_16px_38px_rgba(25,20,15,.15)] transition active:scale-[.985]">
   <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white"><UsersIcon className="h-[17px] w-[17px]"/></span>
   <span className="min-w-0 flex-1"><span className="mnu-kicker block text-white/45">{groupCode?'Active group':'Order together'}</span><span className="mt-1 block line-clamp-2 text-[13px] font-semibold leading-snug">{groupCode?`You’re in group ${groupCode}`:'Everyone orders from their own phone'}</span></span>
   <ArrowUpRightIcon className="h-4 w-4 shrink-0 text-white/45 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"/>
 </Link>;
}
