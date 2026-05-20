// ─── Helpers ──────────────────────────────────────────────────────────────────

function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function layout(preheader: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
</head>
<body style="margin:0;padding:0;background:#f3f6fa;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
<span style="display:none;font-size:1px;color:#f3f6fa;max-height:0;line-height:0;overflow:hidden">${esc(preheader)}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</span>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f3f6fa;padding:24px 0">
<tr><td align="center">
<table width="680" cellpadding="0" cellspacing="0" border="0" style="max-width:680px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden">

<!-- HEADER -->
<tr><td align="center" style="background:#294f73;padding:34px 20px">
<img src="https://sahne.haritailesi.org/logo-email.png" alt="Haritailesi" width="160" style="display:block;border:0;outline:none;text-decoration:none">
</td></tr>

<!-- BODY -->
<tr><td style="padding:44px 50px 32px 50px">
${body}
</td></tr>

<!-- FOOTER -->
<tr><td align="center" style="background:#f0f4f8;padding:26px 20px;color:#8190a5;font-size:14px;line-height:1.7">
Bu e-postayı <strong style="color:#52657f">Haritailesi Vakfı</strong> gönderdi.<br>
<a href="mailto:destek@haritailesi.org" style="color:#294f73;text-decoration:none;font-weight:bold">destek@haritailesi.org</a>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function greeting(name: string): string {
  return `<p style="margin:0 0 24px 0;font-size:16px;color:#4b5b73;line-height:1.7">Merhaba <strong style="color:#111827">${esc(name)}</strong>,</p>`;
}

function h1(text: string): string {
  return `<h1 style="margin:0 0 20px 0;font-size:28px;font-weight:700;color:#172033;line-height:1.3">${text}</h1>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 16px 0;font-size:16px;color:#4b5b73;line-height:1.7">${text}</p>`;
}

function btn(text: string, url: string, variant: 'primary' | 'success' | 'danger' = 'primary'): string {
  const bg = variant === 'success' ? '#16a34a' : variant === 'danger' ? '#dc2626' : '#294f73';
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px 0">
<tr><td style="background:${bg};border-radius:8px">
<a href="${esc(url)}" style="display:inline-block;padding:17px 34px;color:#ffffff;font-size:17px;font-weight:bold;text-decoration:none">${text} &rarr;</a>
</td></tr></table>`;
}

function infoRow(label: string, value: string): string {
  return `<tr>
<td style="padding:10px 16px;font-size:14px;color:#52657f;font-weight:500;white-space:nowrap;border-right:2px solid #e8eef5;width:1%">${esc(label)}</td>
<td style="padding:10px 16px;font-size:14px;color:#172033;font-weight:500">${value}</td>
</tr>`;
}

function infoBox(rows: Array<[string, string]>): string {
  return `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f5f8fc;border:1px solid #dce5f0;border-radius:8px;margin:8px 0 24px 0">
${rows.map(([l, v]) => infoRow(l, v)).join('')}
</table>`;
}

function notice(html: string, type: 'success' | 'warning' | 'info' | 'danger' = 'info'): string {
  const map = {
    success: { bg: '#f0fdf4', border: '#86efac', color: '#15803d' },
    warning: { bg: '#fff6ed', border: '#f4a261', color: '#d9480f' },
    danger:  { bg: '#fef2f2', border: '#fca5a5', color: '#b91c1c' },
    info:    { bg: '#eff6ff', border: '#93c5fd', color: '#1d4ed8' },
  };
  const s = map[type];
  return `<div style="background:${s.bg};border-left:4px solid ${s.border};margin:28px 0 30px 0;padding:18px 20px;color:${s.color};font-size:16px;line-height:1.7">${html}</div>`;
}

function divider(): string {
  return `<hr style="border:none;border-top:1px solid #e5eaf0;margin:28px 0">`;
}

function smallNote(html: string): string {
  return `<p style="margin:8px 0 0 0;font-size:13px;color:#8a96aa;line-height:1.6">${html}</p>`;
}

// ─── Templates ────────────────────────────────────────────────────────────────

type V = Record<string, string | number | boolean>;

function welcome(v: V): string {
  const name = String(v.displayName || 'Değerli Üye');
  return layout(
    'Haritailesi topluluğuna hoş geldiniz!',
    greeting(name) +
    h1('Topluluğa Hoş Geldiniz! 🗺') +
    p('Haritailesi ailesinin bir parçası olmak için verdiğiniz emek için teşekkür ederiz. Artık Türkiye\'nin haritacılık ve coğrafya topluluğunun bir parçasısınız.') +
    p('Mutfak platformunda sizi bekleyen mentörler, etkinlikler ve içeriklerle dolu bir deneyim sizi bekliyor. İlk adımı atmaya hazır mısınız?') +
    btn('Mutfak\'a Giriş Yap', 'https://mutfak.haritailesi.org') +
    divider() +
    p('Herhangi bir sorunuz olursa bizimle iletişime geçmekten çekinmeyin.'),
  );
}

function applicationSubmitted(v: V): string {
  const name = String(v.applicantName || v.displayName || 'Değerli Aday');
  return layout(
    'Başvurunuzu aldık, en kısa sürede değerlendireceğiz.',
    greeting(name) +
    h1('Başvurunuz Alındı') +
    p('Haritailesi Vakfı\'na yaptığınız üyelik başvurusunu aldık. Başvurunuz ekibimiz tarafından değerlendirilmekte; sonuç hakkında en kısa sürede bilgilendirileceksiniz.') +
    infoBox([
      ['Durum', 'İnceleniyor'],
      ['Tahmini Süre', '3–5 iş günü'],
    ]) +
    p('Bu süreçte <strong>Sahne</strong> platformumuzu keşfedebilir, topluluğumuzu daha iyi tanıyabilirsiniz.') +
    btn('Sahne\'yi Keşfet', 'https://sahne.haritailesi.org') +
    smallNote('Bu e-postayı yanlışlıkla aldığınızı düşünüyorsanız görmezden gelebilirsiniz.'),
  );
}

function applicationApproved(v: V): string {
  const name = String(v.applicantName || v.displayName || 'Değerli Aday');
  return layout(
    'Tebrikler! Başvurunuz onaylandı.',
    greeting(name) +
    h1('Başvurunuz Onaylandı! 🎉') +
    notice('<strong>Tebrikler!</strong> Haritailesi topluluğuna katılım başvurunuz değerlendirildi ve onaylandı.', 'success') +
    p('Üyeliğinizi tamamlamak için bir sonraki adım olarak üyelik ücretini ödemeniz gerekmektedir. Ödeme tamamlandıktan sonra hesabınız aktif edilecek ve tüm platform özelliklerine erişim sağlayacaksınız.') +
    btn('Üyeliği Tamamla', 'https://mutfak.haritailesi.org/uyelik') +
    divider() +
    smallNote('Ödeme adımında sorun yaşarsanız destek@haritailesi.org adresine yazabilirsiniz.'),
  );
}

function applicationRejected(v: V): string {
  const name = String(v.applicantName || v.displayName || 'Değerli Aday');
  return layout(
    'Başvurunuz hakkında bilgilendirme.',
    greeting(name) +
    h1('Başvurunuz Hakkında') +
    p('Haritailesi Vakfı\'na yaptığınız başvuruyu dikkatlice inceledik. Bu aşamada üyelik kriterlerimiz çerçevesinde başvurunuzu kabul edemeyeceğimizi bildirmek istiyoruz.') +
    p('Bu karar sizin değerinizi yansıtmamaktadır. Topluluğumuz belirli dönemlerde farklı ihtiyaç ve kriterlere göre üye kabul etmektedir.') +
    notice('İsterseniz 6 ay sonra tekrar başvurabilirsiniz. Ayrıca <a href="https://sahne.haritailesi.org" style="color:#1d4ed8">Sahne</a> platformumuzda içeriklerimizi takip etmeye devam edebilirsiniz.', 'info') +
    smallNote('Daha fazla bilgi için destek@haritailesi.org adresine yazabilirsiniz.'),
  );
}

function applicationInterviewScheduled(v: V): string {
  const name = String(v.applicantName || v.displayName || 'Değerli Aday');
  const scheduledAt = String(v.scheduledAt || '');
  const meetUrl = String(v.meetUrl || '');
  return layout(
    'Mülakat tarihiniz belirlendi.',
    greeting(name) +
    h1('Mülakatınız Planlandı') +
    p('Haritailesi ekibi sizi tanımak istiyor! Üyelik başvurunuz için bir görüşme planlandı.') +
    infoBox([
      ['Tarih & Saat', esc(scheduledAt)],
      ['Format', 'Online görüntülü görüşme'],
    ]) +
    (meetUrl ? btn('Görüşmeye Katıl', meetUrl) : '') +
    divider() +
    p('Görüşmeye katılamayacaksanız lütfen önceden bizimle iletişime geçin.') +
    smallNote('Sorularınız için destek@haritailesi.org adresine yazabilirsiniz.'),
  );
}

function accountSetup(v: V): string {
  const name = String(v.displayName || 'Değerli Üye');
  const url = String(v.setupUrl || '#');
  return layout(
    'Hesabınızı aktif etmek için şifrenizi belirleyin.',
    greeting(name) +
    h1('Hesabınızı Aktif Edin') +
    p('Haritailesi üyeliğiniz onaylandı! Son adım olarak şifrenizi belirleyerek hesabınızı aktif etmeniz gerekiyor.') +
    btn('Şifremi Belirle', url) +
    notice('Bu bağlantı <strong>24 saat</strong> boyunca geçerlidir. Süre dolduktan sonra yeni bir bağlantı talep etmeniz gerekecektir.', 'warning') +
    divider() +
    p('Bu e-postayı siz talep etmediyseniz güvenle görmezden gelebilirsiniz — hesabınızda herhangi bir değişiklik yapılmayacaktır.') +
    smallNote('Bağlantı çalışmıyorsa şu URL\'yi tarayıcınıza kopyalayın: ' + esc(url)),
  );
}

function forgotPassword(v: V): string {
  const name = String(v.displayName || 'Değerli Üye');
  const url = String(v.resetUrl || '#');
  return layout(
    'Şifre sıfırlama talebinizi aldık.',
    greeting(name) +
    h1('Şifrenizi Sıfırlayın') +
    p('Hesabınız için şifre sıfırlama talebinde bulundunuz. Aşağıdaki butona tıklayarak yeni şifrenizi belirleyebilirsiniz.') +
    btn('Şifremi Sıfırla', url) +
    notice('Bu bağlantı <strong>1 saat</strong> içinde geçerliliğini yitirecektir.', 'warning') +
    divider() +
    p('Bu talebi siz yapmadıysanız hesabınız güvende demektir — bu e-postayı görmezden gelebilirsiniz.') +
    smallNote('Bağlantı çalışmıyorsa şu URL\'yi tarayıcınıza kopyalayın: ' + esc(url)),
  );
}

function provisionaryFollowupT2(v: V): string {
  const name = String(v.displayName || 'Değerli Aday');
  return layout(
    'Başvurunuz inceleme aşamasında.',
    greeting(name) +
    h1('Başvurunuz İnceleniyor') +
    p('Haritailesi Vakfı\'na yaptığınız başvuruyu aldığımızı hatırlatmak istedik. Ekibimiz şu anda başvurunuzu değerlendiriyor.') +
    p('İnceleme süreci genellikle <strong>3–5 iş günü</strong> sürmektedir. Karar verildiğinde doğrudan e-posta ile bilgilendirileceksiniz.') +
    p('Bu arada Sahne\'de topluluğumuzu keşfedebilirsiniz:') +
    btn('Sahne\'yi Keşfet', 'https://sahne.haritailesi.org'),
  );
}

function provisionaryFollowupT5(v: V): string {
  const name = String(v.displayName || 'Değerli Aday');
  return layout(
    'Sizi toplulukta görmek istiyoruz.',
    greeting(name) +
    h1('Sizi Bekliyoruz') +
    p('Başvurunuzun değerlendirilmesi devam ediyor. Bu süreçte Haritailesi\'nin neden özel bir yer olduğunu anlatmak istedik.') +
    infoBox([
      ['Topluluk', 'Türkiye\'nin önde gelen haritacı ve coğrafyacıları'],
      ['Mentörlük', 'Alanında uzman mentörlerle bire bir görüşme'],
      ['Etkinlikler', 'Atölye, webinar ve saha çalışmaları'],
      ['İçerik', 'Araştırma, proje ve bilgi paylaşımı'],
    ]) +
    p('Kararı sabırsızlıkla beklediğinizi biliyoruz. En kısa sürede sonuçlanacak.') +
    btn('Sahne\'yi Keşfet', 'https://sahne.haritailesi.org'),
  );
}

function provisionaryFollowupT10(v: V): string {
  const name = String(v.displayName || 'Değerli Aday');
  return layout(
    'Başvurunuz hakkında son güncelleme.',
    greeting(name) +
    h1('Son Güncelleme') +
    p('Başvurunuzun değerlendirilmesinin beklediğinizden uzun sürdüğünü biliyoruz ve bunun için özür dileriz.') +
    p('Ekibimiz önümüzdeki günlerde başvurunuzu sonuçlandıracak ve sizi bilgilendirecektir.') +
    notice('Acil bir durum varsa veya başvurunuzu geri çekmek istiyorsanız bizimle doğrudan iletişime geçebilirsiniz.', 'info') +
    btn('Bize Ulaşın', 'mailto:destek@haritailesi.org', 'primary'),
  );
}

function verificationApproved(v: V): string {
  const name = String(v.displayName || 'Değerli Üye');
  return layout(
    'Belge doğrulamanız onaylandı.',
    greeting(name) +
    h1('Doğrulamanız Onaylandı ✓') +
    notice('<strong>Tebrikler!</strong> Yüklediğiniz belgeler incelendi ve onaylandı. Artık tam üyelik statüsüne sahipsiniz.', 'success') +
    p('Mutfak\'ta tüm özelliklere erişebilir, mentorluk alabilir ve etkinliklere katılabilirsiniz.') +
    btn('Mutfak\'a Git', 'https://mutfak.haritailesi.org'),
  );
}

function verificationRejected(v: V): string {
  const name = String(v.displayName || 'Değerli Üye');
  const reason = v.reason ? `<br><strong>Neden:</strong> ${esc(String(v.reason))}` : '';
  return layout(
    'Belge doğrulamanız hakkında bilgilendirme.',
    greeting(name) +
    h1('Doğrulama Hakkında') +
    p('Yüklediğiniz belgeler incelendi ancak doğrulama gerçekleştirilemedi.') +
    (reason ? notice(reason, 'warning') : '') +
    p('Lütfen gerekli belgeleri güncelleyerek tekrar yükleyin. İşlem tamamlandığında ekibimiz belgelerinizi yeniden inceleyecektir.') +
    btn('Belgeleri Güncelle', 'https://mutfak.haritailesi.org/hesabim') +
    smallNote('Sorularınız için destek@haritailesi.org adresine yazabilirsiniz.'),
  );
}

function paymentConfirmed(v: V): string {
  const name = String(v.displayName || 'Değerli Üye');
  const amount = v.amount ? esc(String(v.amount)) : '';
  return layout(
    'Ödemeniz başarıyla alındı.',
    greeting(name) +
    h1('Ödemeniz Alındı ✓') +
    notice('<strong>Ödeme başarıyla gerçekleşti.</strong> Belge doğrulama aşamasına geçildi.', 'success') +
    (amount ? infoBox([['Ödeme Tutarı', amount]]) : '') +
    p('Belge doğrulama süreciniz başladı. Ekibimiz belgelerinizi inceleyecek ve onaylandığında sizi bilgilendirecektir.') +
    p('Bu işlem genellikle <strong>1–2 iş günü</strong> içinde tamamlanmaktadır.') +
    smallNote('Ödeme makbuzunuza mutfak.haritailesi.org üzerinden ulaşabilirsiniz.'),
  );
}

function paymentReminder(v: V): string {
  const name = String(v.displayName || 'Değerli Üye');
  return layout(
    'Üyeliğinizi tamamlamak için ödeme bekleniyor.',
    greeting(name) +
    h1('Üyeliğinizi Tamamlayın') +
    p('Haritailesi başvurunuz onaylandı! Üyeliğinizi aktif etmek için son adım olan ödeme henüz tamamlanmadı.') +
    p('Ödemenizi tamamlayarak topluluğumuza katılabilir, mentörlerle bağlantı kurabilir ve etkinliklere katılabilirsiniz.') +
    btn('Ödemeyi Tamamla', 'https://mutfak.haritailesi.org/uyelik') +
    smallNote('Ödeme konusunda sorun yaşıyorsanız destek@haritailesi.org adresine yazın.'),
  );
}

function membershipActivated(v: V): string {
  const name = String(v.displayName || 'Değerli Üye');
  const memberNumber = v.memberNumber ? String(v.memberNumber) : '';
  return layout(
    'Üyeliğiniz aktif! Topluluğa katıldınız.',
    greeting(name) +
    h1('Üyeliğiniz Aktif! 🎉') +
    notice('<strong>Haritailesi ailesine hoş geldiniz!</strong> Hesabınız başarıyla aktif edildi.', 'success') +
    (memberNumber ? infoBox([['Üye Numaranız', esc(memberNumber)]]) : '') +
    p('Artık Mutfak platformunun tüm özelliklerine erişebilirsiniz:') +
    infoBox([
      ['Mentörlük', 'Alanında uzman mentörlerle bire bir görüşün'],
      ['Etkinlikler', 'Atölye ve webinarlara katılın'],
      ['İçerik', 'Araştırma ve projelerinizi paylaşın'],
      ['Topluluk', 'Meslektaşlarınızla bağlantı kurun'],
    ]) +
    btn('Mutfak\'a Giriş Yap', 'https://mutfak.haritailesi.org'),
  );
}

function membershipPaused(v: V): string {
  const name = String(v.displayName || 'Değerli Üye');
  return layout(
    'Üyeliğiniz geçici olarak pasife alındı.',
    greeting(name) +
    h1('Üyeliğiniz Pasife Alındı') +
    notice('Üyeliğiniz yönetim kararıyla geçici olarak pasif duruma alınmıştır.', 'warning') +
    p('Bu süreçte platform özelliklerine erişiminiz kısıtlanmıştır. Detaylı bilgi almak veya itirazda bulunmak için bizimle iletişime geçebilirsiniz.') +
    btn('Bize Ulaşın', 'mailto:destek@haritailesi.org') +
    smallNote('Bu e-postayı hatalı aldığınızı düşünüyorsanız lütfen destek@haritailesi.org adresine yazın.'),
  );
}

function membershipReactivated(v: V): string {
  const name = String(v.displayName || 'Değerli Üye');
  return layout(
    'Üyeliğiniz yeniden aktif edildi.',
    greeting(name) +
    h1('Üyeliğiniz Yeniden Aktif') +
    notice('<strong>Haritailesi\'ne tekrar hoş geldiniz!</strong> Üyeliğiniz yeniden aktif edildi.', 'success') +
    p('Tüm platform özelliklerine erişiminiz geri geldi. Sizi yeniden aramızda görmekten mutluluk duyuyoruz.') +
    btn('Mutfak\'a Git', 'https://mutfak.haritailesi.org'),
  );
}

function membershipRenewalReminder(v: V, days: 30 | 7 | 1): string {
  const memberNumber = String(v.memberNumber || '');
  const expiresAt = String(v.expiresAt || '');
  const renewUrl = String(v.renewUrl || 'https://mutfak.haritailesi.org/uyelik/yenile');
  const urgency = days === 1
    ? { title: 'Üyeliğiniz Yarın Sona Eriyor!', noticeType: 'danger' as const }
    : days === 7
    ? { title: 'Üyeliğiniz 7 Gün İçinde Sona Eriyor', noticeType: 'warning' as const }
    : { title: 'Üyeliğinizi Yenileme Zamanı', noticeType: 'info' as const };
  return layout(
    `Üyeliğinizin sona ermesine ${days} gün kaldı.`,
    h1(urgency.title) +
    notice(
      days === 1
        ? '<strong>Son gün!</strong> Üyeliğiniz yarın sona eriyor. Erişiminizin kesilmemesi için bugün yenileyin.'
        : `Üyeliğinizin sona ermesine <strong>${days} gün</strong> kaldı. Sürekli erişim için yenilemenizi öneririz.`,
      urgency.noticeType,
    ) +
    infoBox([
      ['Üye No', esc(memberNumber)],
      ['Geçerlilik Sonu', esc(expiresAt)],
      ['Kalan Süre', `${days} gün`],
    ]) +
    btn('Üyeliği Yenile', renewUrl) +
    smallNote('Yenileme konusunda sorun yaşıyorsanız destek@haritailesi.org adresine yazın.'),
  );
}

function membershipExpired(v: V): string {
  const memberNumber = String(v.memberNumber || '');
  const expiredAt = String(v.expiredAt || '');
  const renewUrl = String(v.renewUrl || 'https://mutfak.haritailesi.org/uyelik/yenile');
  return layout(
    'Üyeliğinizin süresi doldu.',
    h1('Üyeliğiniz Sona Erdi') +
    notice('Üyeliğinizin geçerlilik süresi dolduğundan platform erişiminiz kısıtlandı.', 'danger') +
    infoBox([
      ['Üye No', esc(memberNumber)],
      ['Sona Erme Tarihi', esc(expiredAt)],
    ]) +
    p('Üyeliğinizi yenileyerek topluluğun tüm özelliklerine tekrar erişebilirsiniz. Geçmiş içerikleriniz ve bağlantılarınız korunmaktadır.') +
    btn('Üyeliği Yenile', renewUrl, 'success') +
    smallNote('Sorularınız için destek@haritailesi.org adresine yazın.'),
  );
}

function mentorProfileApproved(v: V): string {
  const name = String(v.displayName || 'Değerli Mentör');
  return layout(
    'Mentor profiliniz onaylandı, mentee\'lerle eşleşmeye hazırsınız.',
    greeting(name) +
    h1('Mentor Profiliniz Onaylandı ✓') +
    notice('<strong>Tebrikler!</strong> Mentor profiliniz incelendi ve onaylandı. Artık mentee adaylarıyla eşleştirilebilirsiniz.', 'success') +
    p('Mutfak\'ta mentee taleplerini takip edebilir, uygun taleplere yanıt verebilir ve toplulukla deneyimlerinizi paylaşabilirsiniz.') +
    p('Profilinizi güncel tutmak; alanlarda uzman olduğunuzu belirtmek mentee eşleşmelerinizi artıracaktır.') +
    btn('Mentor Panelinize Git', 'https://mutfak.haritailesi.org/mentorluk'),
  );
}

function mentorshipRequestReceived(v: V): string {
  const name = String(v.displayName || 'Değerli Mentör');
  const menteeName = String(v.menteeName || '');
  const topic = String(v.topic || '');
  const goal = String(v.goal || '');
  return layout(
    `${menteeName} mentorluk desteğinizi istiyor.`,
    greeting(name) +
    h1('Yeni Mentorluk Talebi') +
    p(`<strong>${esc(menteeName)}</strong> sizden mentorluk desteği talep ediyor. Talebi inceleyerek kabul veya reddedin.`) +
    infoBox([
      ['Talep Eden', esc(menteeName)],
      ['Konu', esc(topic)],
      ['Hedef', esc(goal)],
    ]) +
    btn('Talebi Değerlendir', 'https://mutfak.haritailesi.org/mentorluk') +
    notice('Talebi 48 saat içinde yanıtlamanız önerilir. Yanıtsız talepler otomatik olarak iptal edilebilir.', 'info'),
  );
}

function mentorshipRequestAccepted(v: V): string {
  const name = String(v.displayName || 'Değerli Üye');
  const mentorName = String(v.mentorName || '');
  const scheduledAt = String(v.scheduledAt || '');
  const mentorNote = v.mentorNote ? String(v.mentorNote) : '';
  return layout(
    `${mentorName} mentorluk talebinizi kabul etti!`,
    greeting(name) +
    h1('Mentorluk Talebiniz Kabul Edildi! 🎉') +
    notice(`<strong>${esc(mentorName)}</strong> mentorluk talebinizi kabul etti. Buluşmanız planlandı.`, 'success') +
    infoBox([
      ['Mentör', esc(mentorName)],
      ['Buluşma Zamanı', esc(scheduledAt)],
      ...(mentorNote ? [['Mentör Notu', esc(mentorNote)] as [string, string]] : []),
    ]) +
    p('Takvim davetini e-postanın eki olarak bulabilirsiniz. Buluşmaya hazır olmak için konuyu önceden araştırmanızı öneririz.') +
    btn('Mentörlük Sayfasına Git', 'https://mutfak.haritailesi.org/mentorluk') +
    smallNote('Buluşmaya katılamayacaksanız lütfen mentorunuzu önceden bilgilendirin.'),
  );
}

function mentorshipRequestRejected(v: V): string {
  const name = String(v.displayName || 'Değerli Üye');
  const mentorName = String(v.mentorName || '');
  const mentorNote = v.mentorNote ? String(v.mentorNote) : '';
  return layout(
    'Mentorluk talebi hakkında güncelleme.',
    greeting(name) +
    h1('Mentorluk Talebi Hakkında') +
    p(`<strong>${esc(mentorName)}</strong> bu dönemde talebinizi karşılayamayacağını bildirdi.`) +
    (mentorNote ? infoBox([['Mentör Notu', esc(mentorNote)]]) : '') +
    p('Bu, kişisel bir ret değildir. Mentörler zaman kısıtlamaları ya da uzmanlık uyumsuzluğu nedeniyle bazı talepleri reddedebilir.') +
    notice('Farklı bir mentörle eşleşmeyi deneyebilirsiniz. Topluluğumuzda pek çok uzman sizi bekliyor.', 'info') +
    btn('Başka Mentör Bul', 'https://mutfak.haritailesi.org/mentorluk'),
  );
}

function mentorshipReminder(v: V): string {
  const name = String(v.displayName || 'Değerli Üye');
  const counterpart = String(v.counterpartName || '');
  const scheduledAt = String(v.scheduledAt || '');
  const topic = String(v.topic || '');
  return layout(
    `Yarın ${counterpart} ile mentorluk seansınız var.`,
    greeting(name) +
    h1('Yarın Mentorluk Seansınız Var') +
    notice(`<strong>${esc(counterpart)}</strong> ile seansınız yarın gerçekleşecek. Hazır olmayı unutmayın!`, 'info') +
    infoBox([
      ['Karşı Taraf', esc(counterpart)],
      ['Zaman', esc(scheduledAt)],
      ['Konu', esc(topic)],
    ]) +
    p('Seans için birkaç önerimiz:') +
    p('&bull; Konuyla ilgili sorularınızı önceden hazırlayın<br>&bull; Sessiz bir ortamda bağlanın<br>&bull; Zamanında hazır olun') +
    smallNote('Seansa katılamayacaksanız lütfen karşı tarafı önceden bilgilendirin.'),
  );
}

function mentorshipRescheduleProposed(v: V): string {
  const name = String(v.displayName || 'Değerli Üye');
  const mentorName = String(v.mentorName || '');
  const proposedAt = String(v.proposedAt || '');
  const note = v.rescheduleNote ? String(v.rescheduleNote) : '';
  return layout(
    `${mentorName} yeni bir seans zamanı öneriyor.`,
    greeting(name) +
    h1('Yeni Seans Zamanı Önerisi') +
    p(`Mentörünüz <strong>${esc(mentorName)}</strong> mevcut seans zamanını değiştirmek istiyor ve yeni bir zaman öneriyor.`) +
    infoBox([
      ['Öneren', esc(mentorName)],
      ['Önerilen Yeni Zaman', esc(proposedAt)],
      ...(note ? [['Not', esc(note)] as [string, string]] : []),
    ]) +
    p('Yeni zamanı kabul etmek veya reddetmek için Mutfak\'a giriş yapın.') +
    btn('Yanıt Ver', 'https://mutfak.haritailesi.org/mentorluk'),
  );
}

function mentorshipRescheduleAccepted(v: V): string {
  const name = String(v.displayName || 'Değerli Üye');
  const menteeName = String(v.menteeName || '');
  const newScheduledAt = String(v.newScheduledAt || '');
  return layout(
    'Yeni seans zamanı onaylandı.',
    greeting(name) +
    h1('Yeni Seans Zamanı Onaylandı ✓') +
    notice(`<strong>${esc(menteeName)}</strong> önerdiğiniz yeni zamanı kabul etti.`, 'success') +
    infoBox([
      ['Mentee', esc(menteeName)],
      ['Yeni Seans Zamanı', esc(newScheduledAt)],
    ]) +
    p('Seans takviminize işlendi. Buluşma zamanı yaklaşınca ayrıca hatırlatma e-postası alacaksınız.') +
    btn('Mentörlük Sayfasına Git', 'https://mutfak.haritailesi.org/mentorluk'),
  );
}

function mentorshipRescheduleRejected(v: V): string {
  const name = String(v.displayName || 'Değerli Üye');
  const menteeName = String(v.menteeName || '');
  const origTime = String(v.originalScheduledAt || '');
  return layout(
    'Mentee mevcut seans zamanını tercih etti.',
    greeting(name) +
    h1('Seans Zamanı Değişmedi') +
    notice(`<strong>${esc(menteeName)}</strong> mevcut zamanı tercih ediyor. Seans orijinal zamanında devam ediyor.`, 'info') +
    infoBox([
      ['Mentee', esc(menteeName)],
      ['Seans Zamanı', esc(origTime)],
    ]) +
    p('Seansı iptal etmek istiyorsanız Mutfak üzerinden işlem yapabilirsiniz.') +
    btn('Mentörlük Sayfasına Git', 'https://mutfak.haritailesi.org/mentorluk'),
  );
}

function weeklyDigest(v: V): string {
  const name = String(v.displayName || 'Değerli Üye');
  const weekYear = String(v.weekYear || '');
  const newMemberCount = String(v.newMemberCount || '0');
  const topPosts = String(v.topPosts || 'Bu hafta içerik bulunmuyor.');
  const postsHtml = topPosts
    .split('\n')
    .filter(Boolean)
    .map((line) => `<li style="margin-bottom:8px;font-size:14px;color:#374151;line-height:1.6">${esc(line)}</li>`)
    .join('');
  return layout(
    `${weekYear} haftasında topluluğumuzda neler oldu?`,
    greeting(name) +
    h1('Haftalık Topluluk Özeti') +
    p(`<strong>${esc(weekYear)}</strong> haftasında Haritailesi topluluğunda neler oldu?`) +
    infoBox([
      ['Yeni Üye', `${esc(newMemberCount)} kişi katıldı`],
    ]) +
    `<p style="margin:0 0 10px 0;font-size:14px;font-weight:600;color:#1e293b">Bu Haftanın Öne Çıkan İçerikleri</p>` +
    `<ul style="margin:0 0 20px 0;padding-left:20px">${postsHtml || '<li style="color:#94a3b8;font-size:14px">Bu hafta içerik bulunmuyor.</li>'}</ul>` +
    divider() +
    btn('Tüm İçerikleri Gör', 'https://mutfak.haritailesi.org') +
    smallNote('Bu e-postayı almak istemiyorsanız <a href="https://mutfak.haritailesi.org/ayarlar/bildirimler" style="color:#26496b">bildirim tercihlerinizi</a> güncelleyebilirsiniz.'),
  );
}

function applicationSlaAlert(v: V): string {
  const rows = String(v.rows || '');
  const adminUrl = String(v.adminUrl || 'https://admin.haritailesi.org/basvurular');
  return layout(
    'SLA uyarısı: Bekleyen başvurular inceleme gerektiriyor.',
    h1('&#9888; SLA Uyarısı: Bekleyen Başvurular') +
    notice('Aşağıdaki başvurular belirlenen SLA süresini aşmıştır. Lütfen inceleyiniz.', 'warning') +
    `<table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;font-size:13px;margin:16px 0 24px 0">
<thead>
<tr style="background:#f1f5f9">
<th style="padding:10px 14px;text-align:left;border:1px solid #e2e8f0;font-weight:600;color:#374151">Başvuru Sahibi</th>
<th style="padding:10px 14px;text-align:left;border:1px solid #e2e8f0;font-weight:600;color:#374151">Tür</th>
<th style="padding:10px 14px;text-align:left;border:1px solid #e2e8f0;font-weight:600;color:#374151">Durum</th>
<th style="padding:10px 14px;text-align:right;border:1px solid #e2e8f0;font-weight:600;color:#374151">Bekliyor</th>
</tr>
</thead>
<tbody>${rows}</tbody>
</table>` +
    btn('Admin Paneline Git', adminUrl),
  );
}

// ─── Subject lines ────────────────────────────────────────────────────────────

const SUBJECTS: Record<string, string> = {
  welcome:                         'Haritailesi topluluğuna hoş geldiniz!',
  application_submitted:           'Başvurunuz alındı',
  application_approved:            'Tebrikler! Başvurunuz onaylandı 🎉',
  application_rejected:            'Başvurunuz hakkında bilgilendirme',
  application_interview_scheduled: 'Mülakatınız planlandı',
  account_setup:                   'Haritailesi hesabınızı aktif edin',
  forgot_password:                 'Şifrenizi sıfırlayın',
  provisionary_followup_t2:        'Başvurunuz inceleniyor',
  provisionary_followup_t5:        'Haritailesi\'nde sizi bekliyoruz',
  provisionary_followup_t10:       'Başvurunuz hakkında son güncelleme',
  verification_approved:           'Belge doğrulamanız onaylandı ✓',
  verification_rejected:           'Belge doğrulamanız hakkında bilgilendirme',
  payment_confirmed:               'Ödemeniz alındı ✓',
  payment_reminder:                'Üyeliğinizi tamamlamayı unutmayın',
  membership_activated:            'Üyeliğiniz aktif! Topluluğa hoş geldiniz 🎉',
  membership_paused:               'Üyeliğiniz geçici olarak pasife alındı',
  membership_reactivated:          'Üyeliğiniz yeniden aktif',
  membership_renewal_reminder_30:  'Üyeliğinizin sona ermesine 30 gün kaldı',
  membership_renewal_reminder_7:   'Üyeliğinizin sona ermesine 7 gün kaldı',
  membership_renewal_reminder_1:   'Son gün — üyeliğiniz yarın sona eriyor!',
  membership_expired:              'Üyeliğinizin süresi doldu',
  mentor_profile_approved:         'Mentor profiliniz onaylandı ✓',
  mentorship_request_received:     'Yeni mentorluk talebi aldınız',
  mentorship_request_accepted:     'Mentorluk talebiniz kabul edildi! 🎉',
  mentorship_request_rejected:     'Mentorluk talebi hakkında güncelleme',
  mentorship_reminder:             'Hatırlatma: yarın mentorluk seansınız var',
  mentorship_reschedule_proposed:  'Mentörünüz yeni bir seans zamanı öneriyor',
  mentorship_reschedule_accepted:  'Yeni seans zamanı onaylandı ✓',
  mentorship_reschedule_rejected:  'Seans zamanı değişmedi',
  weekly_digest:                   'Haritailesi haftalık özeti',
  application_sla_alert:           '⚠ Bekleyen başvuru SLA uyarısı',
};

export function getSubject(templateName: string): string {
  return SUBJECTS[templateName] ?? 'Haritailesi bildirimi';
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

export function renderTemplate(name: string, variables: V): string {
  switch (name) {
    case 'welcome':                         return welcome(variables);
    case 'application_submitted':           return applicationSubmitted(variables);
    case 'application_approved':            return applicationApproved(variables);
    case 'application_rejected':            return applicationRejected(variables);
    case 'application_interview_scheduled': return applicationInterviewScheduled(variables);
    case 'account_setup':                   return accountSetup(variables);
    case 'forgot_password':                 return forgotPassword(variables);
    case 'provisionary_followup_t2':        return provisionaryFollowupT2(variables);
    case 'provisionary_followup_t5':        return provisionaryFollowupT5(variables);
    case 'provisionary_followup_t10':       return provisionaryFollowupT10(variables);
    case 'verification_approved':           return verificationApproved(variables);
    case 'verification_rejected':           return verificationRejected(variables);
    case 'payment_confirmed':               return paymentConfirmed(variables);
    case 'payment_reminder':                return paymentReminder(variables);
    case 'membership_activated':            return membershipActivated(variables);
    case 'membership_paused':               return membershipPaused(variables);
    case 'membership_reactivated':          return membershipReactivated(variables);
    case 'membership_renewal_reminder_30':  return membershipRenewalReminder(variables, 30);
    case 'membership_renewal_reminder_7':   return membershipRenewalReminder(variables, 7);
    case 'membership_renewal_reminder_1':   return membershipRenewalReminder(variables, 1);
    case 'membership_expired':              return membershipExpired(variables);
    case 'mentor_profile_approved':         return mentorProfileApproved(variables);
    case 'mentorship_request_received':     return mentorshipRequestReceived(variables);
    case 'mentorship_request_accepted':     return mentorshipRequestAccepted(variables);
    case 'mentorship_request_rejected':     return mentorshipRequestRejected(variables);
    case 'mentorship_reminder':             return mentorshipReminder(variables);
    case 'mentorship_reschedule_proposed':  return mentorshipRescheduleProposed(variables);
    case 'mentorship_reschedule_accepted':  return mentorshipRescheduleAccepted(variables);
    case 'mentorship_reschedule_rejected':  return mentorshipRescheduleRejected(variables);
    case 'weekly_digest':                   return weeklyDigest(variables);
    case 'application_sla_alert':           return applicationSlaAlert(variables);
    default: {
      const fallbackName = String(variables.displayName ?? variables.applicantName ?? 'Değerli Üye');
      return layout(
        'Haritailesi bildirimi.',
        greeting(fallbackName) +
        p(`Haritailesi ekibinden bir bildiriminiz var.`),
      );
    }
  }
}
