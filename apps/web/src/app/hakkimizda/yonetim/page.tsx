import type { Metadata } from 'next';
import { cms } from '@/lib/api';

export const metadata: Metadata = { title: 'Yönetim Kurulu' };

export default async function YonetimKuruluPage() {
  const members = await cms.boardMembers();

  return (
    <main>
      <section className="bg-[var(--color-mavi)] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-4xl font-bold mb-3">Yönetim Kurulu</h1>
          <p className="text-white/70 text-lg">Haritailesi Vakfı yönetim kurulu üyeleri</p>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {!members || members.length === 0 ? (
            <p className="text-gray-500 text-center py-12">Yönetim kurulu bilgileri yakında eklenecektir.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {members.map((member) => (
                <div key={member.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <div className="w-16 h-16 rounded-full bg-[var(--color-mavi)]/10 flex items-center justify-center mb-4 text-2xl font-bold text-[var(--color-mavi)]">
                    {member.name.charAt(0)}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{member.name}</h3>
                  <p className="text-sm text-[var(--color-mavi)] font-medium mt-0.5">{member.title}</p>
                  {member.bio && (
                    <p className="text-sm text-gray-600 mt-3 leading-relaxed">{member.bio}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
