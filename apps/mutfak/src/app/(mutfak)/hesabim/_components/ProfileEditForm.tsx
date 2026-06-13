'use client';

import React from 'react';

const TURKEY_CITIES = [
  'Adana','Adıyaman','Afyonkarahisar','Ağrı','Aksaray','Amasya','Ankara','Antalya','Ardahan','Artvin',
  'Aydın','Balıkesir','Bartın','Batman','Bayburt','Bilecik','Bingöl','Bitlis','Bolu','Burdur',
  'Bursa','Çanakkale','Çankırı','Çorum','Denizli','Diyarbakır','Düzce','Edirne','Elazığ','Erzincan',
  'Erzurum','Eskişehir','Gaziantep','Giresun','Gümüşhane','Hakkari','Hatay','Iğdır','Isparta',
  'İstanbul','İzmir','Kahramanmaraş','Karabük','Karaman','Kars','Kastamonu','Kayseri','Kırıkkale',
  'Kırklareli','Kırşehir','Kilis','Kocaeli','Konya','Kütahya','Malatya','Manisa','Mardin',
  'Mersin','Muğla','Muş','Nevşehir','Niğde','Ordu','Osmaniye','Rize','Sakarya','Samsun',
  'Siirt','Sinop','Sivas','Şanlıurfa','Şırnak','Tekirdağ','Tokat','Trabzon','Tunceli','Uşak',
  'Van','Yalova','Yozgat','Zonguldak',
];

type FormState = {
  displayName: string;
  city: string;
  profession: string;
  bio: string;
  linkedinUrl: string;
  websiteUrl: string;
  portfolioUrl: string;
  skillTagsInput: string;
};

interface ProfileEditFormProps {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  skillTags: string[];
  setSkillTags: React.Dispatch<React.SetStateAction<string[]>>;
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const inp = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b]';

export function ProfileEditForm({
  form,
  setForm,
  skillTags,
  setSkillTags,
  saving,
  onSubmit,
  onCancel,
}: ProfileEditFormProps) {
  const f = (field: keyof FormState) => ({
    value: form[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value })),
    className: inp,
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4 border-t border-gray-100 pt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Ad Soyad</label>
          <input type="text" {...f('displayName')} maxLength={100} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Şehir</label>
          <select
            value={form.city}
            onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
            className={inp}
          >
            <option value="">Seçiniz…</option>
            {TURKEY_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Meslek / Unvan</label>
        <input type="text" {...f('profession')} maxLength={100} />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Hakkımda</label>
        <textarea {...f('bio')} rows={3} maxLength={300} />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">LinkedIn URL</label>
        <input type="url" {...f('linkedinUrl')} maxLength={200} />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Web Sitesi</label>
        <input type="url" {...f('websiteUrl')} maxLength={200} placeholder="https://..." />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Portfolio / CV</label>
        <input type="url" {...f('portfolioUrl')} maxLength={300} placeholder="https://..." />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Beceri Etiketleri</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {skillTags.map((tag) => (
            <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-[#26496b]/10 text-[#26496b] text-xs rounded-full">
              {tag}
              <button
                type="button"
                onClick={() => setSkillTags((prev) => prev.filter((t) => t !== tag))}
                className="hover:text-red-500 leading-none"
                aria-label={`${tag} etiketini kaldır`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={form.skillTagsInput}
            onChange={(e) => setForm((prev) => ({ ...prev, skillTagsInput: e.target.value }))}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ',') && form.skillTagsInput.trim()) {
                e.preventDefault();
                const tag = form.skillTagsInput.trim().replace(/,/g, '');
                if (tag && !skillTags.includes(tag) && skillTags.length < 10) {
                  setSkillTags((prev) => [...prev, tag]);
                }
                setForm((prev) => ({ ...prev, skillTagsInput: '' }));
              }
            }}
            placeholder="Enter veya virgül ile ekle…"
            maxLength={50}
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#26496b]/30 focus:border-[#26496b]"
          />
        </div>
        <p className="text-[10px] text-gray-400 mt-1">En fazla 10 etiket · {skillTags.length}/10</p>
      </div>
      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 text-sm font-semibold text-white bg-[#26496b] hover:bg-[#1e3a56] rounded-lg disabled:opacity-60 transition-colors"
        >
          {saving ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          İptal
        </button>
      </div>
    </form>
  );
}
