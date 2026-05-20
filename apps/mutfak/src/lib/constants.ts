export const TIER_LABELS: Record<string, string> = {
  registered_user: 'Sahne Üyesi',
  haritailesi_genc: 'Haritailesi Genç',
  new_graduate_member: 'Mesleğin Geleceği',
  individual_member: 'Mesleğin Değer Ortağı',
  corporate_member: 'Kurumsal Üye',
};

export const TIER_LABELS_SHORT: Record<string, string> = {
  registered_user: 'Sahne Üyesi',
  haritailesi_genc: 'H. Genç',
  new_graduate_member: 'M. Geleceği',
  individual_member: 'Değer Ortağı',
  corporate_member: 'Kurumsal',
};

export const TIER_COLORS: Record<string, string> = {
  haritailesi_genc: 'bg-emerald-100 text-emerald-700',
  new_graduate_member: 'bg-blue-100 text-blue-700',
  individual_member: 'bg-violet-100 text-violet-700',
  corporate_member: 'bg-amber-100 text-amber-700',
};

export const VERIFICATION_LABELS: Record<string, string> = {
  pending: 'Bekliyor',
  under_review: 'İnceleniyor',
  verified: 'Doğrulandı',
  rejected: 'Reddedildi',
};

export const MENTORSHIP_STATUS_LABELS: Record<string, string> = {
  pending: 'Bekliyor',
  accepted: 'Onaylandı',
  rejected: 'Reddedildi',
  cancelled: 'İptal Edildi',
  completed: 'Tamamlandı',
  reschedule_proposed: 'Yeniden Zamanlama',
};

export const MENTORSHIP_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  accepted: 'bg-blue-100 text-blue-700',
  rejected: 'bg-red-100 text-red-600',
  cancelled: 'bg-gray-100 text-gray-500',
  completed: 'bg-emerald-100 text-emerald-700',
  reschedule_proposed: 'bg-orange-100 text-orange-700',
};

export const SESSION_FORMAT_LABELS: Record<string, string> = {
  online: 'Online',
  in_person: 'Yüz Yüze',
  both: 'Her İkisi',
};

export const EXPERTISE_LABELS: Record<string, string> = {
  kadastro: 'Kadastro',
  fotogrametri: 'Fotogrametri',
  uzaktan_algilama: 'Uzaktan Algılama',
  cbs_gis: 'CBS / GIS',
  insaat_olcmesi: 'İnşaat Ölçmesi',
  gayrimenkul: 'Gayrimenkul',
  deniz_hidrografi: 'Deniz Hidrografisi',
  yazilim_teknoloji: 'Yazılım & Teknoloji',
  kariyer_danismanligi: 'Kariyer Danışmanlığı',
  akademik_arastirma: 'Akademik Araştırma',
  girisimcilik: 'Girişimcilik',
};
