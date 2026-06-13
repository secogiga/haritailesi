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
<tr><td align="center" valign="middle" style="background:#294f73;height:160px;padding:0 20px">
<img src="https://raw.githubusercontent.com/secogiga/haritailesi/main/apps/sahne/public/logo-email.png" alt="Haritailesi" width="260" style="display:block;border:0;outline:none;text-decoration:none">
</td></tr>

<!-- BODY -->
<tr><td style="padding:44px 50px 32px 50px">
${body}
</td></tr>

<!-- FOOTER -->
<tr><td align="center" style="background:#f0f4f8;padding:26px 20px;color:#8190a5;font-size:14px;line-height:1.7">
Bu e-postayı <strong style="color:#52657f">Haritailesi Vakfı</strong> gönderdi.
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
      ['Tahmini Süre', '1–3 iş günü'],
    ]) +
    p('Bu süreçte <strong>Sahne</strong> platformumuzu keşfedebilir, topluluğumuzu daha iyi tanıyabilirsiniz.') +
    btn('Sahne\'yi Keşfet', 'https://sahne.haritailesi.org') +
    smallNote('Bu e-postayı yanlışlıkla aldığınızı düşünüyorsanız görmezden gelebilirsiniz.'),
  );
}

function applicationApproved(v: V): string {
  const name = String(v.applicantName || v.displayName || 'Değerli Aday');
  const appType = String(v.applicationType || '');
  const appId   = String(v.applicationId   || '');

  const isGenc      = appType === 'haritailesi_genc';
  const isCorporate = appType === 'corporate';

  const sahneBase  = process.env['SAHNE_URL'] ?? 'https://sahne.haritailesi.org';
  const paymentUrl = `${sahneBase}/uyelik-odeme?type=${encodeURIComponent(appType)}&ref=${encodeURIComponent(appId)}`;

  let body = '';

  if (isGenc) {
    body =
      notice('<strong>Tebrikler!</strong> Haritailesi Genç başvurunuz onaylandı!', 'success') +
      p('Öğrenci üyeliğiniz <strong>ücretsizdir</strong>. Hesabınız kısa süre içinde aktif edilecek ve platforma erişim bilgileriniz e-posta ile iletilecektir.') +
      btn("Sahne'yi Keşfet", sahneBase) +
      divider() +
      smallNote('Sorularınız için destek@haritailesi.org adresine yazabilirsiniz.');
  } else if (isCorporate) {
    body =
      notice('<strong>Tebrikler!</strong> Kurumsal üyelik başvurunuz onaylandı!', 'success') +
      p('Kurumsal üyeliğinizi tamamlamak için ödeme adımına devam edin. Ödeme yöntemi ve paket detaylarını aşağıdaki linkten bulabilirsiniz.') +
      btn('Kurumsal Üyeliği Tamamla', paymentUrl) +
      divider() +
      smallNote('Ödeme adımında sorun yaşarsanız destek@haritailesi.org adresine yazabilirsiniz.');
  } else {
    // individual ve diğerleri
    body =
      notice('<strong>Tebrikler!</strong> Haritailesi topluluğuna katılım başvurunuz onaylandı.', 'success') +
      p('Mesleğin Değer Ortağı üyeliğinizi tamamlamanız için <strong>1.750 ₺</strong> yıllık bağışınızı yapmanız gerekmektedir. Ödemeniz tamamlandıktan sonra hesabınız aktif edilecek ve Haritailesi Vakfı "Mesleğin Değer Ortağı" olacaksınız.') +
      btn('Üyeliği Tamamla', paymentUrl) +
      divider() +
      smallNote('Ödeme adımında sorun yaşarsanız destek@haritailesi.org adresine yazabilirsiniz.');
  }

  return layout(
    'Tebrikler! Başvurunuz onaylandı.',
    greeting(name) + h1('Başvurunuz Onaylandı! 🎉') + body,
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

function applicationUnderReview(v: V): string {
  const name = String(v.applicantName || v.displayName || 'Değerli Aday');
  return layout(
    'Başvurunuz incelemeye alındı.',
    greeting(name) +
    h1('Başvurunuz İncelemeye Alındı') +
    notice('<strong>Haberleşme başladı!</strong> Başvurunuz ekibimiz tarafından incelemeye alındı.', 'info') +
    p('Haritailesi Vakfı ekibi başvurunuzu titizlikle inceleyecek ve en kısa sürede geri dönüş yapacaktır.') +
    infoBox([
      ['Durum', 'İnceleme Aşamasında'],
      ['Tahmini Süre', '1–3 iş günü'],
    ]) +
    p('Bu süreçte <strong>Sahne</strong> platformumuzu keşfedebilir, topluluğumuzu daha iyi tanıyabilirsiniz.') +
    btn('Sahne\'yi Keşfet', 'https://sahne.haritailesi.org') +
    smallNote('Sorularınız için destek@haritailesi.org adresine yazabilirsiniz.'),
  );
}

function applicationInterviewInvitation(v: V): string {
  const name = String(v.applicantName || v.displayName || 'Değerli Aday');
  const adminName = String(v.adminName || 'Haritailesi Ekibi');
  const slotPickerUrl = String(v.slotPickerUrl || '');
  const confirmUrl = String(v.confirmUrl || '');
  const cancelUrl = String(v.cancelUrl || '');

  // Calendly modu — aday kendi zamanını seçiyor
  if (slotPickerUrl) {
    return layout(
      'Görüşme daveti — uygun zamanınızı seçin.',
      greeting(name) +
      h1('Görüşme Davetiniz Geldi') +
      p(`Haritailesi ekibinden <strong>${esc(adminName)}</strong> sizinle tanışmak istiyor!`) +
      notice('Aşağıdaki bağlantıdan size uygun görüşme zamanını seçebilirsiniz.', 'info') +
      btn('Uygun Zamanı Seçin', slotPickerUrl, 'success') +
      divider() +
      smallNote('Bu bağlantı <strong>7 gün</strong> boyunca geçerlidir. Sorun yaşarsanız destek@haritailesi.org adresine yazın.'),
    );
  }

  // Önerilen saat modu — aday onaylar veya erteler
  return layout(
    'Görüşme daveti — lütfen zamanınızı onaylayın.',
    greeting(name) +
    h1('Görüşme Davetiniz Geldi') +
    p(`Haritailesi ekibinden <strong>${esc(adminName)}</strong> sizinle tanışmak istiyor! Üyelik başvurunuz için bir görüşme planlandı.`) +
    notice('Lütfen aşağıdaki bağlantıyı kullanarak görüşme zamanını onaylayın veya yeniden zamanlama isteyin.', 'info') +
    btn('Görüşme Zamanını Onayla', confirmUrl, 'success') +
    `<table cellpadding="0" cellspacing="0" border="0" style="margin:12px 0"><tr><td>` +
    `<a href="${esc(cancelUrl)}" style="font-size:14px;color:#6b7280;text-decoration:underline">Farklı bir zaman istemek istiyorum</a>` +
    `</td></tr></table>` +
    divider() +
    smallNote('Bu bağlantı <strong>7 gün</strong> boyunca geçerlidir. Sorun yaşarsanız destek@haritailesi.org adresine yazın.'),
  );
}

function meetingBlock(meetUrl: string): string {
  if (!meetUrl) return '';
  const parts = meetUrl.split('|').filter(Boolean);
  const rows: Array<[string, string]> = [];
  const links: string[] = [];
  for (const part of parts) {
    if (part.startsWith('tel:')) {
      const phone = part.slice(4);
      rows.push(['Sesli Arama', `<a href="${esc(part)}" style="color:#294f73;font-weight:600">${esc(phone)}</a>`]);
    } else {
      rows.push(['Video Görüşme', 'Bağlantı aşağıdaki butonda']);
      links.push(btn('Görüşmeye Katıl', part));
    }
  }
  if (!rows.length) return '';
  return infoBox(rows) + links.join('');
}

function applicationInterviewConfirmed(v: V): string {
  const name = String(v.applicantName || v.displayName || 'Değerli Aday');
  const scheduledAt = String(v.scheduledAt || '');
  const meetUrl = String(v.meetUrl || '');
  return layout(
    'Görüşmeniz onaylandı — detaylar içeride.',
    greeting(name) +
    h1('Görüşmeniz Onaylandı ✓') +
    notice('<strong>Harika!</strong> Görüşme zamanınızı onayladınız. Sizi bekliyor olacağız.', 'success') +
    infoBox([['Tarih & Saat', esc(scheduledAt)]]) +
    meetingBlock(meetUrl) +
    p('Görüşme için birkaç önerimiz:') +
    p('&bull; Sessiz bir ortamda katılın<br>&bull; Kendinizi ve çalışmalarınızı tanıtmaya hazır olun') +
    divider() +
    smallNote('Görüşmeye katılamayacaksanız lütfen önceden bizimle iletişime geçin.'),
  );
}

function applicationInterviewRescheduled(v: V): string {
  const applicantName = String(v.applicantName || v.displayName || 'Başvuran');
  const rescheduleNote = String(v.rescheduleNote || '');
  const adminUrl = String(v.adminUrl || 'https://admin.haritailesi.org/basvurular');
  return layout(
    'Aday görüşme için yeniden zamanlama istedi.',
    h1('Yeniden Zamanlama Talebi') +
    notice(`<strong>${esc(applicantName)}</strong> görüşme için başka bir zaman talep etti.`, 'warning') +
    (rescheduleNote ? infoBox([['Aday Notu', esc(rescheduleNote)]]) : '') +
    p('Lütfen admin panelinden yeni bir zaman belirleyin ve adaya bildirin.') +
    btn('Admin Paneline Git', adminUrl),
  );
}

function applicationInterviewScheduled(v: V): string {
  const name = String(v.applicantName || v.displayName || 'Değerli Aday');
  const scheduledAt = String(v.scheduledAt || '');
  const meetUrl = String(v.meetUrl || '');
  const noDetails = !scheduledAt && !meetUrl;
  return layout(
    'Mülakat tarihiniz belirlendi.',
    greeting(name) +
    h1('Mülakatınız Planlandı') +
    p('Haritailesi ekibi sizi tanımak istiyor! Üyelik başvurunuz için bir görüşme planlandı.') +
    (scheduledAt ? infoBox([['Tarih & Saat', esc(scheduledAt)]]) : '') +
    meetingBlock(meetUrl) +
    (noDetails ? notice('Ekibimiz en kısa sürede tarih ve bağlantı bilgilerini sizinle paylaşacak.', 'info') : '') +
    divider() +
    p('Görüşmeye katılamayacaksanız lütfen önceden bizimle iletişime geçin.'),
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
    p('İnceleme süreci genellikle <strong>1–3 iş günü</strong> sürmektedir. Karar verildiğinde doğrudan e-posta ile bilgilendirileceksiniz.') +
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
  const name    = String(v.displayName    || 'Değerli Üye');
  const appType = String(v.applicationType || '');
  const appId   = String(v.applicationId   || '');
  const sahneBase  = process.env['SAHNE_URL'] ?? 'https://sahne.haritailesi.org';
  const paymentUrl = appId
    ? `${sahneBase}/uyelik-odeme?type=${encodeURIComponent(appType)}&ref=${encodeURIComponent(appId)}`
    : `${sahneBase}/uyelik-odeme`;
  return layout(
    'Üyeliğinizi tamamlamak için ödeme bekleniyor.',
    greeting(name) +
    h1('Üyeliğinizi Tamamlayın') +
    p('Haritailesi başvurunuz onaylandı! Üyeliğinizi aktif etmek için son adım olan ödeme henüz tamamlanmadı.') +
    p('Ödemenizi tamamlayarak topluluğumuza katılabilir, mentörlerle bağlantı kurabilir ve etkinliklere katılabilirsiniz.') +
    btn('Ödemeyi Tamamla', paymentUrl) +
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

function feedbackReceived(v: V): string {
  const subject = String(v.feedbackSubject || 'talebiniz');
  const ticketNo = String(v.ticketNo || '');
  return layout(
    'Talebiniz alındı, ekibimiz en kısa sürede dönüş yapacak.',
    h1('Talebiniz Alındı') +
    notice('<strong>Çözüm talebinizi aldık.</strong> Ekibimiz inceleyip en kısa sürede size dönüş yapacak.', 'info') +
    infoBox([
      ['Talep Numarası', `#${ticketNo}`],
      ['Konu', esc(subject)],
      ['Durum', 'Açık'],
    ]) +
    `<div style="background:#f5f8fc;border:1px solid #dce5f0;border-radius:8px;padding:16px 20px;margin:20px 0">
      <p style="margin:0 0 10px 0;font-size:13px;font-weight:700;color:#26496b">Sırada ne var?</p>
      <div style="display:flex;flex-direction:column;gap:8px">
        <div style="display:flex;align-items:flex-start;gap:10px">
          <span style="font-size:16px;flex-shrink:0">✅</span>
          <span style="font-size:13px;color:#172033">Talebiniz sisteme kaydedildi</span>
        </div>
        <div style="display:flex;align-items:flex-start;gap:10px">
          <span style="font-size:16px;flex-shrink:0">🔍</span>
          <span style="font-size:13px;color:#172033">Ekibimiz 24 saat içinde incelemeye alacak</span>
        </div>
        <div style="display:flex;align-items:flex-start;gap:10px">
          <span style="font-size:16px;flex-shrink:0">📬</span>
          <span style="font-size:13px;color:#172033">Her durum değişikliğinde e-posta ile bilgilendirileceksiniz</span>
        </div>
      </div>
    </div>` +
    p('Ek bilgi eklemek veya talebinizi güncellemek için bu e-postayı yanıtlayabilirsiniz.') +
    btn('Yeni Talep Gönder', 'https://sahne.haritailesi.org/haritailesipusula') +
    divider() +
    smallNote('Sorularınız için <a href="mailto:destek@haritailesi.org" style="color:#294f73">destek@haritailesi.org</a> adresine yazabilirsiniz.'),
  );
}

function feedbackReviewing(v: V): string {
  const subject = String(v.feedbackSubject || 'talebiniz');
  const ticketNo = String(v.ticketNo || '');
  return layout(
    'Talebiniz ön incelemeye alındı.',
    h1('Talebiniz İnceleniyor') +
    notice('<strong>Haritailesi ekibi talebinizi ön incelemeye aldı.</strong> Kısa süre içinde size dönüş yapacağız.', 'info') +
    infoBox([
      ['Talep Numarası', `#${ticketNo}`],
      ['Konu', esc(subject)],
      ['Durum', 'Ön İncelemede'],
    ]) +
    p('Bu aşamada talebinizi doğru uzman veya birime yönlendirmek için değerlendiriyoruz. <strong>Genellikle 1–2 iş günü</strong> içinde bir sonraki adım hakkında sizi bilgilendiririz.') +
    p('Ek bilgi veya belge eklemek isterseniz bu e-postayı yanıtlayabilirsiniz.') +
    divider() +
    smallNote('Sorularınız için <a href="mailto:destek@haritailesi.org" style="color:#294f73">destek@haritailesi.org</a> adresine yazabilirsiniz.'),
  );
}

function feedbackInProgress(v: V): string {
  const subject = String(v.feedbackSubject || 'talebiniz');
  return layout(
    'Talebiniz ekibimizde — uzmanımız aktif olarak inceliyor.',
    h1('Talebiniz Ekibimizde') +
    notice('<strong>Uzmanımız talebinizi aktif olarak inceliyor.</strong> En kısa sürede geri dönüş yapacağız.', 'info') +
    infoBox([
      ['Konu', esc(subject)],
      ['Durum', 'Ekibimizde'],
    ]) +
    p('Talebiniz ilgili uzmanımıza iletildi. <strong>Ortalama 2–3 iş günü</strong> içinde somut bir yanıt veya yönlendirme alacaksınız.') +
    p('Bu süreçte ek bilgiye ihtiyaç duyarsak sizinle doğrudan iletişime geçeceğiz.') +
    divider() +
    smallNote('Sorularınız için <a href="mailto:destek@haritailesi.org" style="color:#294f73">destek@haritailesi.org</a> adresine yazabilirsiniz.'),
  );
}

function feedbackResolved(v: V): string {
  const subject = String(v.feedbackSubject || 'talebiniz');
  const adminNotes = v.adminNotes ? String(v.adminNotes) : '';
  return layout(
    'Talebiniz çözüme kavuşturuldu.',
    h1('Talebiniz Çözüldü ✓') +
    notice('<strong>Talebiniz ekibimiz tarafından işleme alındı ve çözüme kavuşturuldu.</strong> İlginiz için teşekkür ederiz.', 'success') +
    infoBox([
      ['Konu', esc(subject)],
      ['Durum', 'Çözüldü'],
    ]) +
    (adminNotes ? `<div style="margin:20px 0"><p style="margin:0 0 8px 0;font-size:13px;font-weight:600;color:#52657f;text-transform:uppercase;letter-spacing:0.05em">Ekibimizin Notu</p><div style="background:#f5f8fc;border:1px solid #dce5f0;border-radius:8px;padding:16px 20px;font-size:15px;color:#172033;line-height:1.7">${esc(adminNotes)}</div></div>` : '') +
    p('Başka bir sorunuz veya talebiniz varsa bize ulaşmaktan çekinmeyin.') +
    btn('Görüş & Talep Gönder', 'https://sahne.haritailesi.org/haritailesipusula') +
    divider() +
    smallNote('Sorularınız için <a href="mailto:destek@haritailesi.org" style="color:#294f73">destek@haritailesi.org</a> adresine yazabilirsiniz.'),
  );
}

function feedbackAwaitingInfo(v: V): string {
  const subject = String(v.feedbackSubject || 'talebiniz');
  const adminReply = String(v.adminReply || '');
  return layout(
    'Talebiniz için ek bilgiye ihtiyacımız var.',
    h1('Ek Bilgi Bekleniyor') +
    notice('<strong>Talebinizi değerlendiriyoruz</strong> ancak daha iyi yardımcı olabilmek için birkaç ek bilgiye ihtiyacımız var.', 'warning') +
    infoBox([
      ['Konu', esc(subject)],
      ['Durum', 'Bilgi Bekleniyor'],
    ]) +
    (adminReply ? `<div style="margin:20px 0"><p style="margin:0 0 8px 0;font-size:13px;font-weight:600;color:#52657f;text-transform:uppercase;letter-spacing:0.05em">Ekibimizin Notu</p><div style="background:#f5f8fc;border:1px solid #dce5f0;border-radius:8px;padding:16px 20px;font-size:15px;color:#172033;line-height:1.7">${esc(adminReply)}</div></div>` : '') +
    p('Lütfen bu e-postayı yanıtlayarak veya aşağıdaki bağlantıyı kullanarak ek bilgileri paylaşın.') +
    btn('Talep Merkezi', 'https://sahne.haritailesi.org/haritailesipusula') +
    divider() +
    smallNote('Sorularınız için <a href="mailto:destek@haritailesi.org" style="color:#294f73">destek@haritailesi.org</a> adresine yazabilirsiniz.'),
  );
}

function feedbackMentoring(v: V): string {
  const subject = String(v.feedbackSubject || 'talebiniz');
  return layout(
    'Talebiniz bir mentöre yönlendirildi.',
    h1('Mentöre Yönlendirildiniz 🤝') +
    notice('<strong>Talebiniz değerlendirildi</strong> ve konunuzda deneyimli bir mentöre yönlendirildi.', 'info') +
    infoBox([
      ['Konu', esc(subject)],
      ['Durum', 'Mentöre Yönlendirildi'],
    ]) +
    `<div style="background:#f5f0ff;border:1px solid #e0d5f5;border-radius:8px;padding:16px 20px;margin:20px 0">
      <p style="margin:0 0 10px 0;font-size:13px;font-weight:700;color:#6b3fa0">Bundan sonra ne olacak?</p>
      <div style="display:flex;flex-direction:column;gap:8px">
        <div style="display:flex;align-items:flex-start;gap:10px">
          <span style="font-size:16px;flex-shrink:0">🔎</span>
          <span style="font-size:13px;color:#172033">Konunuza en uygun mentör profili belirlendi</span>
        </div>
        <div style="display:flex;align-items:flex-start;gap:10px">
          <span style="font-size:16px;flex-shrink:0">📨</span>
          <span style="font-size:13px;color:#172033">Mentörünüz genellikle <strong>3–5 iş günü</strong> içinde sizinle iletişime geçer</span>
        </div>
        <div style="display:flex;align-items:flex-start;gap:10px">
          <span style="font-size:16px;flex-shrink:0">📅</span>
          <span style="font-size:13px;color:#172033">Görüşme zamanı ve şekli mentörünüzle birlikte belirlenir</span>
        </div>
      </div>
    </div>` +
    p('Tercihlerinizi belirtmek veya ek bilgi eklemek için bu e-postayı yanıtlayabilirsiniz.') +
    btn('Talep Merkezi', 'https://sahne.haritailesi.org/haritailesipusula') +
    divider() +
    smallNote('Sorularınız için <a href="mailto:destek@haritailesi.org" style="color:#294f73">destek@haritailesi.org</a> adresine yazabilirsiniz.'),
  );
}

function feedbackPartnerReferred(v: V): string {
  const subject = String(v.feedbackSubject || 'talebiniz');
  return layout(
    'Talebiniz bir iş ortağımıza yönlendirildi.',
    h1('Talebiniz Partner\'a Yönlendirildi') +
    notice('<strong>Talebinizi inceledik</strong> ve size en iyi desteği sağlayabilecek iş ortağımıza ilettik.', 'info') +
    infoBox([
      ['Konu', esc(subject)],
      ['Durum', 'Partnere Yönlendirildi'],
    ]) +
    `<div style="background:#f0f4ff;border:1px solid #d5e0f5;border-radius:8px;padding:16px 20px;margin:20px 0">
      <p style="margin:0 0 10px 0;font-size:13px;font-weight:700;color:#3a5fa0">Süreç nasıl işler?</p>
      <div style="display:flex;flex-direction:column;gap:8px">
        <div style="display:flex;align-items:flex-start;gap:10px">
          <span style="font-size:16px;flex-shrink:0">📤</span>
          <span style="font-size:13px;color:#172033">Talebiniz partner firmamıza iletildi</span>
        </div>
        <div style="display:flex;align-items:flex-start;gap:10px">
          <span style="font-size:16px;flex-shrink:0">📞</span>
          <span style="font-size:13px;color:#172033">Firma temsilcisi <strong>2–3 iş günü</strong> içinde doğrudan sizinle iletişime geçecek</span>
        </div>
        <div style="display:flex;align-items:flex-start;gap:10px">
          <span style="font-size:16px;flex-shrink:0">🆓</span>
          <span style="font-size:13px;color:#172033">Bu yönlendirme için herhangi bir ücret talep edilmez</span>
        </div>
      </div>
    </div>` +
    p('Süreci takip etmek veya sorularınız için bize yazabilirsiniz.') +
    btn('Talep Merkezi', 'https://sahne.haritailesi.org/haritailesipusula') +
    divider() +
    smallNote('Sorularınız için <a href="mailto:destek@haritailesi.org" style="color:#294f73">destek@haritailesi.org</a> adresine yazabilirsiniz.'),
  );
}

function feedbackEducationSuggested(v: V): string {
  const subject = String(v.feedbackSubject || 'talebiniz');
  const adminReply = String(v.adminReply || '');
  return layout(
    'Talebiniz için eğitim önerisi hazırlandı.',
    h1('Eğitim Önerisi 🎓') +
    notice('<strong>Talebinizi inceledik</strong> ve ihtiyacınıza uygun bir eğitim programı önermek istiyoruz.', 'info') +
    infoBox([
      ['Konu', esc(subject)],
      ['Durum', 'Eğitim Önerildi'],
    ]) +
    (adminReply ? `<div style="margin:20px 0"><p style="margin:0 0 8px 0;font-size:13px;font-weight:600;color:#52657f;text-transform:uppercase;letter-spacing:0.05em">Ekibimizin Önerisi</p><div style="background:#f5f8fc;border:1px solid #dce5f0;border-radius:8px;padding:16px 20px;font-size:15px;color:#172033;line-height:1.7">${esc(adminReply)}</div></div>` : '') +
    p('Eğitim programları hakkında daha fazla bilgi almak için aşağıdaki bağlantıyı kullanabilirsiniz.') +
    btn('Eğitimler', 'https://sahne.haritailesi.org/egitimler') +
    divider() +
    smallNote('Sorularınız için <a href="mailto:destek@haritailesi.org" style="color:#294f73">destek@haritailesi.org</a> adresine yazabilirsiniz.'),
  );
}

function feedbackSatisfactionRequest(v: V): string {
  const subject = String(v.feedbackSubject || 'talebiniz');
  const satisfactionUrl = String(v.satisfactionUrl || 'https://sahne.haritailesi.org/haritailesipusula');
  return layout(
    'Aldığınız desteği değerlendirir misiniz?',
    h1('Desteğimizi Nasıl Buldunuz? ⭐') +
    notice('<strong>Talebiniz çözüme kavuşturuldu.</strong> Hizmet kalitemizi geliştirmemize yardımcı olacak bir dakikanızı ayırır mısınız?', 'success') +
    infoBox([
      ['Konu', esc(subject)],
    ]) +
    p('Aldığınız desteği 1-5 arasında puanlamanız hem bizim için hem de sektördeki diğer üyelerimiz için çok değerli.') +
    btn('Desteği Değerlendir', satisfactionUrl) +
    divider() +
    smallNote('Bu değerlendirme isteğini almak istemiyorsanız görmezden gelebilirsiniz.'),
  );
}

function dmReceived(v: V): string {
  const name = String(v.recipientName || 'Değerli Üye');
  const senderName = String(v.senderName || 'Bir üye');
  const preview = String(v.messagePreview || '');
  return layout(
    `${senderName} size mesaj gönderdi.`,
    greeting(name) +
    h1('Yeni Bir Mesajınız Var') +
    notice(`<strong>${esc(senderName)}</strong> size bir mesaj gönderdi.`, 'info') +
    (preview ? infoBox([['Mesaj Önizleme', esc(preview.length > 200 ? preview.slice(0, 200) + '…' : preview)]]) : '') +
    btn('Mesajı Görüntüle', 'https://mutfak.haritailesi.org/mesajlar') +
    divider() +
    smallNote('Bu bildirimi almak istemiyorsanız <a href="https://mutfak.haritailesi.org/ayarlar/bildirimler" style="color:#294f73">bildirim tercihlerinizi</a> güncelleyebilirsiniz.'),
  );
}

function adminBroadcast(v: V): string {
  const name = String(v.recipientName || 'Değerli Üye');
  const subject = String(v.subject || 'Haritailesi Bildirimi');
  const body = String(v.body || '');
  return layout(
    subject,
    greeting(name) +
    h1(esc(subject)) +
    p(esc(body).replace(/\n/g, '<br>')) +
    divider() +
    smallNote('Bu e-postayı <strong>Haritailesi Vakfı</strong> gönderdi. Sorularınız için <a href="mailto:destek@haritailesi.org" style="color:#294f73">destek@haritailesi.org</a> adresine yazabilirsiniz.'),
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

function levelUp(v: V): string {
  const name       = String(v.displayName  || 'Değerli Üye');
  const levelLabel = String(v.levelLabel   || '');
  return layout(
    `Tebrikler! ${levelLabel} kademesine yükseldiniz.`,
    greeting(name) +
    h1('Yeni Kademeye Yükseldiniz! 🎉') +
    notice(`<strong>Tebrikler!</strong> Gerçekleştirdiğiniz aksiyonlar sayesinde <strong>${esc(levelLabel)}</strong> kademesine yükseldiniz.`, 'success') +
    p('Haritailesi topluluğuna yaptığınız her katkı sizi daha ileri taşıyor. Yolculuğunuzu Sahne\'den takip edebilirsiniz.') +
    btn('Sahne\'de Gör', 'https://sahne.haritailesi.org/profil') +
    divider() +
    smallNote('Kademe sistemi hakkında bilgi almak için <a href="mailto:destek@haritailesi.org" style="color:#294f73">destek@haritailesi.org</a> adresine yazabilirsiniz.'),
  );
}

// ─── Subject lines ────────────────────────────────────────────────────────────

function otpVerification(v: V): string {
  return layout(
    'Doğrulama kodunuz hazır.',
    `<tr><td style="padding:32px 40px 0">
      <h2 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#1e3a5f">Doğrulama Kodunuz</h2>
      <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6">
        Haritailesi Pusula\'da anonim mesaj gönderimini doğrulamak için aşağıdaki kodu kullanın.
      </p>
      <div style="text-align:center;margin:0 0 24px">
        <span style="display:inline-block;background:#f0f4f8;border:2px dashed #26496b;border-radius:12px;padding:18px 36px;font-size:36px;font-weight:700;letter-spacing:12px;color:#26496b;font-family:monospace">${esc(v.code)}</span>
      </div>
      <p style="margin:0 0 8px;font-size:13px;color:#6b7280;text-align:center">Bu kod <strong>5 dakika</strong> geçerlidir.</p>
      <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center">Bu kodu siz istemediyseniz bu e-postayı dikkate almayın.</p>
    </td></tr>`,
  );
}

const SUBJECTS: Record<string, string> = {
  otp_verification:                'Haritailesi Pusula — Doğrulama Kodunuz',
  newsletter_confirm:              'Bülten aboneliğinizi onaylayın',
  welcome:                         'Haritailesi topluluğuna hoş geldiniz!',
  application_submitted:           'Başvurunuz alındı',
  application_approved:            'Tebrikler! Başvurunuz onaylandı 🎉',
  application_rejected:            'Başvurunuz hakkında bilgilendirme',
  application_under_review:            'Başvurunuz incelemeye alındı',
  application_interview_invitation:    'Görüşme daveti — zamanınızı onaylayın',
  application_interview_confirmed:     'Görüşmeniz onaylandı ✓',
  application_interview_rescheduled:   '⚠ Aday yeniden zamanlama istedi',
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
  feedback_received:               'Talebiniz alındı',
  feedback_reviewing:              'Talebiniz incelemeye alındı',
  feedback_in_progress:            'Talebiniz işleme alındı',
  feedback_resolved:               'Talebiniz çözüldü ✓',
  feedback_awaiting_info:          'Talebiniz için ek bilgiye ihtiyacımız var',
  feedback_mentoring:              'Talebiniz bir mentöre yönlendirildi 🤝',
  feedback_partner_referred:       'Talebiniz partnerimize iletildi',
  feedback_education_suggested:    'Eğitim önerisi hazırlandı 🎓',
  feedback_satisfaction_request:   'Aldığınız desteği değerlendirir misiniz? ⭐',
  dm_received:                     'Yeni mesajınız var',
  admin_broadcast:                 'Haritailesi bildirimi',
  level_up:                        'Yeni kademeye yükseldiniz! 🎉',
  event_reminder_24h:              'Etkinlik hatırlatması — yarın!',
  event_reminder_1h:               'Etkinlik 1 saat sonra başlıyor!',
  event_invitation:                'Sizi bir etkinliğe davet ediyoruz 📅',
  event_ticket:                    'E-Biletiniz hazır — katılımınız onaylandı ✓',
  store_order_confirmed:           'Siparişiniz alındı ✓',
  store_order_processing:          'Siparişiniz hazırlanıyor 🔧',
  store_order_shipped:             'Siparişiniz kargoya verildi 📦',
  store_order_delivered:           'Siparişiniz teslim edildi ✅',
  store_order_cancelled:           'Siparişiniz iptal edildi',
  store_seller_approved:           'Satıcı başvurunuz onaylandı ✓',
  store_seller_rejected:           'Satıcı başvurunuz hakkında',
  store_digital_download:          'İndirme linkiniz hazır 📥',
  store_abandoned_cart:            'Sepetinizde ürünler bekliyor',
  store_abandoned_cart_24h:        'Sepetiniz hâlâ sizi bekliyor 🕐',
  store_abandoned_cart_72h:        'Son hatırlatma — sepetinizdeki ürünler 🛒',
  store_gift_card:                 'Hediye kartınız hazır 🎁',
  store_payout_released:           'Ödemeniz serbest bırakıldı 💰',
  store_payout_paid:               'Ödemeniz hesabınıza aktarıldı ✓',
  store_review_request:            'Siparişinizi değerlendirir misiniz? ⭐',
  store_stock_available:           'Beklediğiniz ürün tekrar stokta! 🎉',
  listing_contact:                 'İlanınıza yeni bir mesaj aldınız',
  listing_expiry_reminder:         'İlanınızın süresi 7 gün içinde dolacak',
  listing_alert_new:               'Takip ettiğiniz kategoride yeni ilan var',
  test_certificate:                'Tebrikler! Test sertifikanız hazır 🏆',
  competition_result_winner:       'Tebrikler! Yarışma sonuçları açıklandı 🎉',
  survey_participated:             'Anket yanıtınız alındı — teşekkürler!',
};

// ─── Event Ticket ─────────────────────────────────────────────────────────────

function eventTicket(v: V): string {
  const qrDataUrl = v['qrDataUrl'] as string ?? '';
  const ticketCode = String(v['ticketCode'] ?? '');
  const verifyUrl = v['verifyUrl'] as string ?? 'https://haritailesi.org';

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937">
<span style="display:none;font-size:1px;color:#f0f4f8;max-height:0;overflow:hidden">Etkinlik biletiniz hazır. QR kodunuzu kapıda gösterin. &zwnj;&nbsp;</span>
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f0f4f8;padding:24px 0">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%">

  <!-- LOGO HEADER -->
  <tr><td align="center" style="background:#294f73;border-radius:14px 14px 0 0;padding:28px 20px">
    <img src="https://raw.githubusercontent.com/secogiga/haritailesi/main/apps/sahne/public/logo-email.png" alt="Haritailesi" width="200" style="display:block;border:0">
  </td></tr>

  <!-- BİLET GÖVDE -->
  <tr><td style="background:#fff;padding:0">
    <!-- Üst şerit -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="background:#294f73;color:#fff;padding:20px 32px 20px">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;opacity:.7">E-BİLET · ELEKTRONİK KATILIM BELGESİ</p>
          <p style="margin:0;font-size:22px;font-weight:800;line-height:1.3">${esc(v['eventTitle'])}</p>
        </td>
      </tr>
    </table>

    <!-- Kesik çizgi -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td width="20" style="background:#f0f4f8;border-radius:0 50% 50% 0"></td>
        <td style="border-top:2px dashed #d1d9e6;height:2px"></td>
        <td width="20" style="background:#f0f4f8;border-radius:50% 0 0 50%"></td>
      </tr>
    </table>

    <!-- İçerik -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:24px 32px">
      <tr>
        <!-- Detaylar -->
        <td valign="top" style="padding-right:24px">
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1px">Katılımcı</p>
          <p style="margin:0 0 20px;font-size:16px;font-weight:700;color:#111827">${esc(v['displayName'])}</p>

          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1px">Tarih & Saat</p>
          <p style="margin:0 0 20px;font-size:14px;color:#374151">${esc(v['eventDate'])}</p>

          ${v['eventLocation'] ? `
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1px">Konum</p>
          <p style="margin:0 0 20px;font-size:14px;color:#374151">${esc(v['eventLocation'])}</p>` : ''}

          ${v['eventType'] ? `
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1px">Tür</p>
          <p style="margin:0 0 20px;font-size:14px;color:#374151">${esc(v['eventType'])}</p>` : ''}

          <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1px">Bilet Kodu</p>
          <p style="margin:0;font-size:13px;font-family:monospace;color:#294f73;font-weight:700;letter-spacing:2px">${esc(ticketCode.toUpperCase())}</p>
        </td>

        <!-- QR Kod -->
        <td valign="top" align="center" style="width:160px;min-width:160px">
          ${qrDataUrl ? `<img src="${qrDataUrl}" width="140" height="140" alt="QR Kod" style="display:block;border:4px solid #e5e7eb;border-radius:8px;background:#fff">` : ''}
          <p style="margin:8px 0 0;font-size:10px;color:#9ca3af;text-align:center">Kapıda gösterin</p>
        </td>
      </tr>
    </table>

    <!-- Kesik çizgi alt -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td width="20" style="background:#f0f4f8;border-radius:0 50% 50% 0"></td>
        <td style="border-top:2px dashed #d1d9e6;height:2px"></td>
        <td width="20" style="background:#f0f4f8;border-radius:50% 0 0 50%"></td>
      </tr>
    </table>

    <!-- Alt bilgi -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:20px 32px 28px">
      <tr>
        <td>
          <p style="margin:0 0 12px;font-size:13px;color:#6b7280;line-height:1.6">
            Bu bilet kişiye özeldir. QR kodu veya bilet kodunu kapıda ibraz edin.
            Sorun yaşarsanız <a href="mailto:iletisim@haritailesi.org" style="color:#294f73">iletisim@haritailesi.org</a> adresine yazın.
          </p>
          <a href="${esc(String(verifyUrl))}" style="display:inline-block;background:#294f73;color:#fff;font-size:13px;font-weight:600;padding:10px 24px;border-radius:8px;text-decoration:none">
            Etkinlik Sayfası →
          </a>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- FOOTER -->
  <tr><td align="center" style="background:#1e3a56;border-radius:0 0 14px 14px;padding:20px;color:#94a3b8;font-size:12px">
    <p style="margin:0">© Haritailesi Vakfı · <a href="https://haritailesi.org" style="color:#94a3b8">haritailesi.org</a></p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// ─── Event Invitation ─────────────────────────────────────────────────────────

function eventInvitation(v: V): string {
  const ctaUrl = v['eventUrl'] ?? 'https://haritailesi.org/etkinlikler';
  const regUrl  = v['registrationUrl'] ?? ctaUrl;
  return layout(
    `${esc(v['eventTitle'])} etkinliğine davetlisiniz`,
    `<tr><td style="padding:32px 40px 0">
  <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e3a56">
    📅 Etkinlik Daveti
  </h2>
  <p style="margin:0 0 20px;color:#6b7280;font-size:15px">
    Merhaba ${esc(v['displayName'])},
  </p>
  <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6">
    Sizi <strong style="color:#1e3a56">${esc(v['eventTitle'])}</strong> etkinliğine davet ediyoruz.
    ${v['eventDescription'] ? `<br><br>${esc(v['eventDescription'])}` : ''}
  </p>
  <table cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border-radius:10px;padding:20px 24px;width:100%;box-sizing:border-box;margin-bottom:24px">
    <tr><td>
      <p style="margin:0 0 8px;font-size:14px;color:#374151">
        <strong>📅 Tarih:</strong>&nbsp;${esc(v['eventDate'])}
      </p>
      ${v['eventLocation'] ? `<p style="margin:0 0 8px;font-size:14px;color:#374151"><strong>📍 Yer:</strong>&nbsp;${esc(v['eventLocation'])}</p>` : ''}
      ${v['meetingUrl'] ? `<p style="margin:0;font-size:14px;color:#374151"><strong>🖥 Format:</strong>&nbsp;Online</p>` : ''}
    </td></tr>
  </table>
  <a href="${esc(String(regUrl))}" style="display:inline-block;background:#294f73;color:#fff;font-size:14px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;margin-bottom:32px">
    Etkinliğe Kayıt Ol
  </a>
</td></tr>`,
  );
}

// ─── Event Reminder ───────────────────────────────────────────────────────────

function eventReminder(v: V, hoursLeft: number): string {
  const timeLabel = hoursLeft === 1 ? '1 saat' : `${hoursLeft} saat`;
  const ctaUrl = v['eventUrl'] ?? 'https://haritailesi.org/etkinlikler';
  const meetingUrl = v['meetingUrl'];
  return layout(
    `${esc(v['eventTitle'])} etkinliği ${timeLabel} sonra başlıyor!`,
    `<tr><td style="padding:32px 40px 0">
  <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e3a56">
    ${hoursLeft === 1 ? '⏰ 1 Saat Kaldı!' : '📅 Yarın Başlıyor!'}
  </h2>
  <p style="margin:0 0 24px;color:#6b7280;font-size:15px">
    Merhaba ${esc(v['displayName'])},
  </p>
  <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6">
    <strong style="color:#1e3a56">${esc(v['eventTitle'])}</strong> etkinliği
    <strong>${timeLabel} sonra</strong> başlıyor. Kaçırmamak için hazır olun!
  </p>
  <table cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border-radius:10px;padding:20px 24px;width:100%;box-sizing:border-box;margin-bottom:24px">
    <tr><td>
      <p style="margin:0 0 8px;font-size:14px;color:#374151">
        <strong>📅 Tarih:</strong>&nbsp;${esc(v['eventDate'])}
      </p>
      ${v['eventLocation'] ? `<p style="margin:0 0 8px;font-size:14px;color:#374151"><strong>📍 Yer:</strong>&nbsp;${esc(v['eventLocation'])}</p>` : ''}
      ${meetingUrl ? `<p style="margin:0;font-size:14px;color:#374151"><strong>🖥 Online:</strong>&nbsp;<a href="${esc(meetingUrl)}" style="color:#2563eb">Toplantı Bağlantısı</a></p>` : ''}
    </td></tr>
  </table>
  <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px">
    <tr>
      <td style="padding-right:12px">
        <a href="${esc(String(ctaUrl))}" style="display:inline-block;background:#294f73;color:#fff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none">
          Etkinlik Sayfasına Git
        </a>
      </td>
      ${meetingUrl ? `<td><a href="${esc(String(meetingUrl))}" style="display:inline-block;background:#059669;color:#fff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none">Toplantıya Katıl</a></td>` : ''}
    </tr>
  </table>
</td></tr>`,
  );
}

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
    case 'application_under_review':            return applicationUnderReview(variables);
    case 'application_interview_invitation':    return applicationInterviewInvitation(variables);
    case 'application_interview_confirmed':     return applicationInterviewConfirmed(variables);
    case 'application_interview_rescheduled':   return applicationInterviewRescheduled(variables);
    case 'application_interview_scheduled':     return applicationInterviewScheduled(variables);
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
    case 'feedback_received':               return feedbackReceived(variables);
    case 'feedback_reviewing':              return feedbackReviewing(variables);
    case 'feedback_in_progress':            return feedbackInProgress(variables);
    case 'feedback_resolved':               return feedbackResolved(variables);
    case 'feedback_awaiting_info':          return feedbackAwaitingInfo(variables);
    case 'feedback_mentoring':              return feedbackMentoring(variables);
    case 'feedback_partner_referred':       return feedbackPartnerReferred(variables);
    case 'feedback_education_suggested':    return feedbackEducationSuggested(variables);
    case 'feedback_satisfaction_request':   return feedbackSatisfactionRequest(variables);
    case 'dm_received':                     return dmReceived(variables);
    case 'admin_broadcast':                 return adminBroadcast(variables);
    case 'level_up':                        return levelUp(variables);
    case 'event_reminder_24h':              return eventReminder(variables, 24);
    case 'event_reminder_1h':              return eventReminder(variables, 1);
    case 'event_invitation':               return eventInvitation(variables);
    case 'event_ticket':                   return eventTicket(variables);
    case 'course_certificate_issued':      return courseCertificateIssued(variables);
    case 'course_completed':               return courseCompleted(variables);
    case 'course_announcement':            return courseAnnouncement(variables);
    case 'course_payment_confirmed':       return coursePaymentConfirmed(variables);
    case 'course_payment_rejected':        return coursePaymentRejected(variables);
    case 'store_order_confirmed':          return storeOrderConfirmed(variables);
    case 'store_order_processing':         return storeOrderProcessing(variables);
    case 'store_order_shipped':            return storeOrderShipped(variables);
    case 'store_order_delivered':          return storeOrderDelivered(variables);
    case 'store_order_cancelled':          return storeOrderCancelled(variables);
    case 'store_seller_approved':          return storeSellerApproved(variables);
    case 'store_seller_rejected':          return storeSellerRejected(variables);
    case 'store_digital_download':         return storeDigitalDownload(variables);
    case 'store_abandoned_cart':           return storeAbandonedCart(variables);
    case 'store_abandoned_cart_24h':       return storeAbandonedCart24h(variables);
    case 'store_abandoned_cart_72h':       return storeAbandonedCart72h(variables);
    case 'store_gift_card':                return storeGiftCard(variables);
    case 'store_payout_released':          return storePayoutReleased(variables);
    case 'store_payout_paid':              return storePayoutPaid(variables);
    case 'store_review_request':           return storeReviewRequest(variables);
    case 'store_stock_available':          return storeStockAvailable(variables);
    case 'listing_contact':                return listingContact(variables);
    case 'listing_expiry_reminder':        return listingExpiryReminder(variables);
    case 'listing_alert_new':              return listingAlertNew(variables);
    case 'newsletter_confirm':             return newsletterConfirm(variables);
    case 'otp_verification':               return otpVerification(variables);
    case 'comment_verify':                 return commentVerify(variables);
    case 'test_certificate':              return testCertificate(variables);
    case 'competition_result_winner':     return competitionResultWinner(variables);
    case 'survey_participated':           return surveyParticipated(variables);
    case 'library_regulation_update':    return libraryRegulationUpdate(variables);
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

// ─── Kurs E-posta Şablonları ───────────────────────────────────────────────────

function courseCertificateIssued(v: V): string {
  const name = String(v.displayName || 'Değerli Üye');
  const trainingTitle = String(v.trainingTitle || 'Kurs');
  const certCode = String(v.certCode || '');
  const certUrl = String(v.certUrl || 'https://sahne.haritailesi.org/egitim');
  return layout(
    `${trainingTitle} sertifikanız hazır!`,
    greeting(name) +
    h1('Sertifikanız Hazır! 🏆') +
    p(`<strong>${esc(trainingTitle)}</strong> kursunu başarıyla tamamladınız ve sertifikanız oluşturuldu.`) +
    infoBox([
      ['Kurs', trainingTitle],
      ['Sertifika Kodu', certCode],
    ]) +
    btn('Sertifikamı Görüntüle', certUrl, 'success') +
    divider() +
    smallNote('Sertifikanızı LinkedIn profilinizde paylaşabilir, sertifika doğrulama sayfasından başkalarıyla paylaşabilirsiniz.'),
  );
}

function courseCompleted(v: V): string {
  const name = String(v.displayName || 'Değerli Üye');
  const trainingTitle = String(v.trainingTitle || 'Kurs');
  const courseUrl = String(v.courseUrl || 'https://sahne.haritailesi.org/egitim');
  return layout(
    `${trainingTitle} kursunu tamamladınız!`,
    greeting(name) +
    h1('Kursu Tamamladınız! 🎓') +
    p(`Tebrikler! <strong>${esc(trainingTitle)}</strong> kursundaki tüm dersleri tamamladınız.`) +
    p('Eğer kurs için bir quiz varsa, sertifikanızı almak için şimdi tamamlayabilirsiniz.') +
    btn('Kursa Git', courseUrl) +
    divider() +
    p('Haritailesi eğitim platformunda sizi bekleyen daha fazla kurs için <a href="https://sahne.haritailesi.org/egitim" style="color:#294f73">eğitim sayfasını</a> ziyaret edin.'),
  );
}

function courseAnnouncement(v: V): string {
  const name = String(v.displayName || 'Değerli Üye');
  const trainingTitle = String(v.trainingTitle || 'Kurs');
  const announcementTitle = String(v.announcementTitle || 'Duyuru');
  const announcementBody = String(v.announcementBody || '');
  const courseUrl = String(v.courseUrl || 'https://sahne.haritailesi.org/egitim');
  return layout(
    `${trainingTitle}: ${announcementTitle}`,
    greeting(name) +
    h1(`📢 ${esc(announcementTitle)}`) +
    p(`<strong>${esc(trainingTitle)}</strong> kursunda yeni bir duyuru var:`) +
    notice(esc(announcementBody), 'info') +
    btn('Kursa Git', courseUrl) +
    divider() +
    smallNote('Bu e-postayı aldınız çünkü bu kursa kayıtlısınız.'),
  );
}

function coursePaymentConfirmed(v: V): string {
  const name = String(v.displayName || 'Değerli Üye');
  const trainingTitle = String(v.trainingTitle || 'Kurs');
  const courseUrl = String(v.courseUrl || 'https://mutfak.haritailesi.org/egitim');
  const adminNote = v.adminNote ? String(v.adminNote) : null;
  return layout(
    `Ödemeniz onaylandı — ${trainingTitle}`,
    greeting(name) +
    h1('🎓 Ödemeniz Onaylandı!') +
    p(`<strong>${esc(trainingTitle)}</strong> kursu için yaptığınız ödeme onaylandı. Kursa hemen erişmeye başlayabilirsiniz.`) +
    (adminNote ? notice(esc(adminNote), 'info') : '') +
    btn('Kursa Git', courseUrl) +
    divider() +
    smallNote('İyi dersler dileriz!'),
  );
}

function coursePaymentRejected(v: V): string {
  const name = String(v.displayName || 'Değerli Üye');
  const trainingTitle = String(v.trainingTitle || 'Kurs');
  const adminNote = v.adminNote ? String(v.adminNote) : null;
  return layout(
    `Ödeme talebiniz hakkında — ${trainingTitle}`,
    greeting(name) +
    h1('❌ Ödeme Talebi Reddedildi') +
    p(`<strong>${esc(trainingTitle)}</strong> kursu için ödeme talebiniz işlenemedi.`) +
    (adminNote ? notice(esc(adminNote), 'warning') : '') +
    p('Sorularınız için <a href="mailto:destek@haritailesi.org" style="color:#294f73;font-weight:bold">destek@haritailesi.org</a> adresine yazabilirsiniz.') +
    divider() +
    smallNote('Haritailesi destek ekibi'),
  );
}

// ─── Mağaza E-posta Şablonları ────────────────────────────────────────────────

function storeOrderConfirmed(v: V): string {
  const name = String(v.buyerName || 'Değerli Müşteri');
  const orderId = String(v.orderId || '');
  const total = String(v.total || '');
  const items = String(v.items || '');
  const orderUrl = String(v.orderUrl || 'https://sahne.haritailesi.org/magaza/siparislerim');
  const hasPhysical = v.hasPhysical === true || v.hasPhysical === 'true';
  return layout(
    `Siparişiniz alındı — ${total}`,
    greeting(name) +
    h1('Siparişiniz Alındı! ✅') +
    p('Siparişinizi aldık ve işleme koyuyoruz. Aşağıda sipariş detaylarınızı bulabilirsiniz.') +
    infoBox([
      ['Sipariş No', orderId.slice(-8).toUpperCase()],
      ['Tutar', total],
      ['Ürünler', items],
    ]) +
    (hasPhysical
      ? notice('Fiziksel ürünleriniz hazırlandıktan sonra kargoya verilecek ve takip numaranız e-posta ile iletilecektir.', 'info')
      : notice('Dijital ürünlerinize erişim bilgileri ayrıca iletilecektir.', 'success')
    ) +
    btn('Sipariş Takibi', orderUrl) +
    divider() +
    p('Sorularınız için <a href="mailto:destek@haritailesi.org" style="color:#294f73">destek@haritailesi.org</a> adresine yazabilirsiniz.'),
  );
}

function storeOrderShipped(v: V): string {
  const name = String(v.buyerName || 'Değerli Müşteri');
  const productTitle = String(v.productTitle || 'Ürününüz');
  const trackingNumber = v.trackingNumber ? String(v.trackingNumber) : null;
  const trackingCompany = v.trackingCompany ? String(v.trackingCompany) : null;
  const orderUrl = String(v.orderUrl || 'https://sahne.haritailesi.org/magaza/siparislerim');
  return layout(
    `${productTitle} kargoya verildi`,
    greeting(name) +
    h1('Siparişiniz Yola Çıktı! 📦') +
    p(`<strong>${esc(productTitle)}</strong> kargoya verildi.`) +
    (trackingNumber
      ? infoBox([
          ['Kargo Firması', trackingCompany ?? '—'],
          ['Takip Numarası', trackingNumber],
        ])
      : ''
    ) +
    btn('Sipariş Takibi', orderUrl) +
    divider() +
    smallNote('Siparişiniz genellikle 3–5 iş günü içinde teslim edilir.'),
  );
}

function storeSellerApproved(v: V): string {
  const name = String(v.applicantName || 'Değerli Başvurucu');
  const dashboardUrl = String(v.dashboardUrl || 'https://mutfak.haritailesi.org/magazam');
  return layout(
    'Satıcı başvurunuz onaylandı!',
    greeting(name) +
    h1('Satıcı Başvurunuz Onaylandı! 🎉') +
    p('Haritailesi Mağazası\'nda satıcı olarak yer almak için başvurunuz incelendi ve onaylandı.') +
    p('Artık ürünlerinizi yönetebilir, siparişlerinizi takip edebilirsiniz.') +
    btn('Mağaza Paneline Git', dashboardUrl, 'success') +
    divider() +
    p('Ürünlerinizin mağazaya eklenmesi için yönetiminizle iletişime geçin veya yönetici tarafından eklenecektir.'),
  );
}

function storeDigitalDownload(v: V): string {
  const name = String(v.buyerName || 'Değerli Müşteri');
  const productTitle = String(v.productTitle || 'Ürününüz');
  const downloadUrl = String(v.downloadUrl || '#');
  const orderUrl = String(v.orderUrl || 'https://sahne.haritailesi.org/magaza/siparislerim');
  return layout(
    `${productTitle} — indirme linkiniz hazır`,
    greeting(name) +
    h1('İndirme Linkiniz Hazır! 📥') +
    p(`Satın aldığınız <strong>${esc(productTitle)}</strong> ürününe erişim linkiniz aşağıda.`) +
    notice('Güvenlik nedeniyle indirme linki 7 gün geçerlidir. Lütfen bu süre içinde indirin.', 'info') +
    btn('Ürünü İndir', downloadUrl, 'success') +
    divider() +
    p(`Sipariş durumunu kontrol etmek için <a href="${esc(orderUrl)}" style="color:#294f73">siparişlerim sayfasını</a> ziyaret edebilirsiniz.`),
  );
}

function storeAbandonedCart(v: V): string {
  const name = String(v.buyerName || 'Değerli Müşteri');
  const items = String(v.items || '');
  const cartUrl = String(v.cartUrl || 'https://sahne.haritailesi.org/magaza');
  return layout(
    'Sepetinizde ürünler sizi bekliyor',
    greeting(name) +
    h1('Sepetinizi Unutmayın! 🛒') +
    p('Bir süre önce oluşturduğunuz siparişi tamamlamadınız. Ürünleriniz hâlâ sizi bekliyor.') +
    (items ? infoBox([['Ürünler', items]]) : '') +
    btn('Sepete Dön', cartUrl) +
    divider() +
    smallNote('Bu e-postayı almak istemiyorsanız dikkate almayınız.'),
  );
}

function storeGiftCard(v: V): string {
  const name = String(v.recipientName || 'Değerli Kişi');
  const senderName = String(v.senderName || 'Bir arkadaşınız');
  const code = String(v.code || '');
  const amount = String(v.amount || '');
  const message = v.message ? String(v.message) : null;
  const shopUrl = String(v.shopUrl || 'https://sahne.haritailesi.org/magaza');
  return layout(
    `${senderName} size hediye kartı gönderdi! 🎁`,
    greeting(name) +
    h1('Hediye Kartınız Geldi! 🎁') +
    p(`<strong>${esc(senderName)}</strong> size Haritailesi Mağazası'nda kullanabileceğiniz bir hediye kartı gönderdi.`) +
    (message ? notice(esc(message), 'info') : '') +
    infoBox([
      ['Hediye Kodu', code],
      ['Tutar', amount],
    ]) +
    btn('Mağazaya Git', shopUrl, 'success') +
    divider() +
    smallNote('Hediye kartı kodunuzu ödeme sırasında kupon kodu alanına girerek kullanabilirsiniz.'),
  );
}

function storeSellerRejected(v: V): string {
  const name = String(v.applicantName || 'Değerli Başvurucu');
  const adminNotes = v.adminNotes ? String(v.adminNotes) : null;
  return layout(
    'Satıcı başvurunuz hakkında',
    greeting(name) +
    h1('Satıcı Başvurusu Hakkında') +
    p('Satıcı başvurunuzu inceledik. Maalesef bu aşamada onaylayamıyoruz.') +
    (adminNotes ? notice(esc(adminNotes), 'warning') : '') +
    p('Sorularınız için <a href="mailto:destek@haritailesi.org" style="color:#294f73">destek@haritailesi.org</a> adresine yazabilirsiniz.') +
    divider() +
    smallNote('Haritailesi ekibi'),
  );
}

function storeOrderProcessing(v: V): string {
  const name = String(v.buyerName || 'Değerli Müşteri');
  const orderId = String(v.orderId || '');
  const orderUrl = String(v.orderUrl || 'https://sahne.haritailesi.org/magaza/siparislerim');
  return layout(
    'Siparişiniz hazırlanıyor',
    greeting(name) +
    h1('Siparişiniz Hazırlanıyor 🔧') +
    p('Ödemeniz onaylandı. Siparişiniz şu an hazırlanıyor, en kısa sürede kargoya verilecek.') +
    infoBox([['Sipariş No', orderId.slice(-8).toUpperCase()]]) +
    btn('Siparişimi Takip Et', orderUrl) +
    divider() +
    smallNote('Kargoya verildiğinde size ayrıca bilgi göndereceğiz.'),
  );
}

function storeOrderDelivered(v: V): string {
  const name = String(v.buyerName || 'Değerli Müşteri');
  const orderId = String(v.orderId || '');
  const orderUrl = String(v.orderUrl || 'https://sahne.haritailesi.org/magaza/siparislerim');
  return layout(
    'Siparişiniz teslim edildi',
    greeting(name) +
    h1('Siparişiniz Teslim Edildi! ✅') +
    p('Siparişinizin teslim edildiği bildirildi. Umarız beğenirsiniz!') +
    infoBox([['Sipariş No', orderId.slice(-8).toUpperCase()]]) +
    notice('Ürününüzü değerlendirmeniz bizim ve satıcılar için çok önemli. Birkaç dakikanızı ayırır mısınız?', 'success') +
    btn('Sipariş Detayı', orderUrl) +
    divider() +
    p('Bir sorun yaşadıysanız <a href="mailto:destek@haritailesi.org" style="color:#294f73">destek@haritailesi.org</a> adresinden bize ulaşabilirsiniz.'),
  );
}

function storeOrderCancelled(v: V): string {
  const name = String(v.buyerName || 'Değerli Müşteri');
  const orderId = String(v.orderId || '');
  const orderUrl = String(v.orderUrl || 'https://sahne.haritailesi.org/magaza/siparislerim');
  const reason = v.reason ? String(v.reason) : null;
  return layout(
    'Siparişiniz iptal edildi',
    greeting(name) +
    h1('Siparişiniz İptal Edildi') +
    p('Siparişinizin iptal edildiğini bildirmek isteriz.') +
    infoBox([['Sipariş No', orderId.slice(-8).toUpperCase()]]) +
    (reason ? notice(esc(reason), 'warning') : '') +
    p('Ödemeniz yapıldıysa en geç 5–7 iş günü içinde iade edilecektir.') +
    btn('Sipariş Detayı', orderUrl, 'danger') +
    divider() +
    p('Sorularınız için <a href="mailto:destek@haritailesi.org" style="color:#294f73">destek@haritailesi.org</a> adresine yazabilirsiniz.'),
  );
}

function storePayoutReleased(v: V): string {
  const name = String(v.sellerName || 'Değerli Satıcı');
  const amount = String(v.amount || '');
  const orderUrl = String(v.orderUrl || 'https://mutfak.haritailesi.org/magazam');
  return layout(
    `${amount} ödemeniz serbest bırakıldı`,
    greeting(name) +
    h1('Ödemeniz Serbest Bırakıldı! 💰') +
    p('Alıcı siparişin teslim edildiğini onayladı. Ödemeniz artık aktarılmaya hazır durumda.') +
    infoBox([['Serbest Tutar', amount]]) +
    notice('Ödemeniz en yakın iş gününde IBAN hesabınıza aktarılacaktır. Yönetiminiz sizi bilgilendirecek.', 'success') +
    btn('Mağaza Panelimdeki Bakiyem', orderUrl) +
    divider() +
    smallNote('Sorularınız için destek@haritailesi.org adresine yazabilirsiniz.'),
  );
}

function storePayoutPaid(v: V): string {
  const name = String(v.sellerName || 'Değerli Satıcı');
  const amount = String(v.amount || '');
  const dashboardUrl = String(v.dashboardUrl || 'https://mutfak.haritailesi.org/magazam');
  return layout(
    `${amount} hesabınıza aktarıldı`,
    greeting(name) +
    h1('Ödemeniz Aktarıldı! ✓') +
    p('Satışlarınızdan elde ettiğiniz tutar IBAN hesabınıza başarıyla aktarıldı.') +
    infoBox([['Aktarılan Tutar', amount]]) +
    btn('Mağaza Panelimdeki Geçmiş', dashboardUrl, 'success') +
    divider() +
    smallNote('Ödeme geçmişinizi Mağaza Panelinizden → Bakiye sekmesinden inceleyebilirsiniz.'),
  );
}

function storeAbandonedCart24h(v: V): string {
  const name = String(v.buyerName || 'Değerli Müşteri');
  const items = String(v.items || '');
  const cartUrl = String(v.cartUrl || 'https://sahne.haritailesi.org/magaza');
  return layout(
    'Sepetinizdeki ürünler sizi bekliyor',
    greeting(name) +
    h1('Siparişinizi Tamamlamayı Unuttunuz mu? 🕐') +
    p('Dün başlattığınız siparişi henüz tamamlamadınız. Ürünleriniz sepetinizde sizi bekliyor.') +
    (items ? infoBox([['Sepetinizdeki Ürünler', items]]) : '') +
    notice('Stoklar sınırlı olabilir. Siparişinizi erken tamamlamanızı öneririz.', 'warning') +
    btn('Sepetime Dön', cartUrl) +
    divider() +
    smallNote('Bu e-postayı almak istemiyorsanız dikkate almayınız.'),
  );
}

function storeAbandonedCart72h(v: V): string {
  const name = String(v.buyerName || 'Değerli Müşteri');
  const items = String(v.items || '');
  const cartUrl = String(v.cartUrl || 'https://sahne.haritailesi.org/magaza');
  return layout(
    'Son hatırlatma — sepetinizdeki ürünler',
    greeting(name) +
    h1('Son Fırsat — Sepetiniz Sizi Bekliyor 🛒') +
    p('3 gün önce başlattığınız siparişi henüz tamamlamadınız. Bu son hatırlatmamızdır.') +
    (items ? infoBox([['Sepetinizdeki Ürünler', items]]) : '') +
    btn('Şimdi Tamamla', cartUrl, 'success') +
    divider() +
    p('Herhangi bir sorun mu yaşıyorsunuz? <a href="mailto:destek@haritailesi.org" style="color:#294f73">Bize yazın</a>, yardımcı olalım.') +
    smallNote('Bu e-postayı almak istemiyorsanız dikkate almayınız.'),
  );
}

function storeReviewRequest(v: V): string {
  const name = String(v.buyerName || 'Değerli Müşteri');
  const orderId = String(v.orderId || '');
  const reviewUrl = String(v.reviewUrl || 'https://sahne.haritailesi.org/magaza/siparislerim');
  return layout(
    'Siparişinizi değerlendirir misiniz?',
    greeting(name) +
    h1('Siparişinizi Değerlendirir Misiniz? ⭐') +
    p('Yakın zamanda Haritailesi Mağazası\'ndan bir alışveriş yaptınız. Deneyiminizi bizimle ve diğer üyelerle paylaşır mısınız?') +
    infoBox([['Sipariş No', orderId.slice(-8).toUpperCase()]]) +
    p('Yorumlarınız hem satıcıların gelişimine hem de diğer alıcıların doğru karar vermesine yardımcı olur.') +
    btn('Yorum Yaz', reviewUrl, 'success') +
    divider() +
    smallNote('Bu e-posta siparişiniz teslim edildikten 3 gün sonra otomatik olarak gönderildi.'),
  );
}

function storeStockAvailable(v: V): string {
  const name = String(v.buyerName || 'Değerli Müşteri');
  const productTitle = String(v.productTitle || 'Takip ettiğiniz ürün');
  const productUrl = String(v.productUrl || 'https://sahne.haritailesi.org/magaza');
  return layout(
    `${productTitle} tekrar stokta!`,
    greeting(name) +
    h1('Beklediğiniz Ürün Tekrar Stokta! 🎉') +
    p(`Stok alarmı kurduğunuz <strong>${esc(productTitle)}</strong> ürünü tekrar mağazamıza eklendi.`) +
    notice('Stoklar hızlı tükeniyor olabilir. Hemen sipariş vermek isteyebilirsiniz.', 'warning') +
    btn('Ürüne Git', productUrl, 'success') +
    divider() +
    smallNote('Bu bildirim, ürünü stok alarmına eklediğiniz için gönderildi.'),
  );
}

// ─── Listing Contact ───────────────────────────────────────────────────────────

function listingContact(v: V): string {
  const listingTitle   = String(v.listingTitle   || 'İlan');
  const listingCompany = String(v.listingCompany || '');
  const senderName     = String(v.senderName     || 'Bir ziyaretçi');
  const senderEmail    = String(v.senderEmail    || '');
  const message        = String(v.message        || '');
  return layout(
    `${senderName} ilanınıza mesaj gönderdi`,
    h1('İlanınıza Mesaj Aldınız') +
    infoBox([
      ['İlan', esc(listingTitle)],
      ...(listingCompany ? [['Firma / Kurum', esc(listingCompany)] as [string, string]] : []),
      ['Gönderen', esc(senderName)],
      ['E-posta', esc(senderEmail)],
    ]) +
    p('Mesaj içeriği:') +
    `<div style="background:#f5f8fc;border-left:4px solid #294f73;border-radius:0 8px 8px 0;padding:16px 20px;margin:0 0 24px 0;font-size:15px;color:#1f2937;line-height:1.7;white-space:pre-wrap">${esc(message)}</div>` +
    p(`Bu kişiyle iletişime geçmek için <a href="mailto:${esc(senderEmail)}" style="color:#294f73;font-weight:600">${esc(senderEmail)}</a> adresine yanıt verebilirsiniz.`) +
    btn('Yanıtla', `mailto:${esc(senderEmail)}`) +
    divider() +
    smallNote('Bu mesaj, Haritailesi İlan Panosu üzerinden ilanınıza yapılan iletişim formundan iletildi.'),
  );
}

function listingAlertNew(v: V): string {
  const listingTitle   = String(v.listingTitle   || 'Yeni İlan');
  const listingCompany = String(v.listingCompany || '');
  const catLabel       = String(v.catLabel       || '');
  const listingUrl     = String(v.listingUrl     || 'https://sahne.haritailesi.org/ilanlar');
  const unsubUrl       = String(v.unsubUrl       || '');
  return layout(
    `${catLabel ? catLabel + ' kategorisinde' : 'İlan panosunda'} yeni bir ilan yayınlandı`,
    h1('Yeni İlan Yayınlandı') +
    (catLabel ? notice(`<strong>${esc(catLabel)}</strong> kategorisinde yeni bir ilan yayınlandı.`, 'info') : '') +
    infoBox([
      ['İlan Başlığı', esc(listingTitle)],
      ...(listingCompany ? [['Firma / Kurum', esc(listingCompany)] as [string, string]] : []),
    ]) +
    btn('İlanı İncele', listingUrl, 'primary') +
    divider() +
    smallNote(unsubUrl ? `Bu bildirimleri almak istemiyorsanız <a href="${esc(unsubUrl)}" style="color:#52657f">aboneliği iptal edin</a>.` : 'Bu bildirim, ilan panosu aboneliğiniz kapsamında gönderildi.'),
  );
}

function listingExpiryReminder(v: V): string {
  const displayName  = String(v.displayName  || 'Değerli Üye');
  const listingTitle = String(v.listingTitle  || 'İlanınız');
  const daysLeft     = String(v.daysLeft      || '7');
  const expiresAt    = String(v.expiresAt     || '');
  const renewUrl     = String(v.renewUrl      || 'https://mutfak.haritailesi.org/ilanlarim');
  return layout(
    `İlanınızın süresi ${daysLeft} gün içinde dolacak`,
    greeting(displayName) +
    h1('İlanınız Yakında Sona Eriyor') +
    notice(`<strong>${esc(listingTitle)}</strong> başlıklı ilanınızın süresi <strong>${daysLeft} gün</strong> içinde dolacak.${expiresAt ? ` Son tarih: <strong>${esc(expiresAt)}</strong>.` : ''}`, 'warning') +
    p('İlanınızın yayında kalmaya devam etmesini istiyorsanız Mutfak üzerinden yenileme talebinde bulunabilirsiniz.') +
    btn('İlanımı Yenile', renewUrl) +
    divider() +
    smallNote('Bu hatırlatma, ilanınızın süresi dolmadan otomatik olarak gönderildi.'),
  );
}

// ─── Bülten Abonelik Onayı ────────────────────────────────────────────────────

function newsletterConfirm(v: V): string {
  const confirmUrl = String(v.confirmUrl || '#');
  return layout(
    'E-posta adresinizi onaylayın — Haritailesi Bülteni',
    h1('Bülten aboneliğinizi onaylayın') +
    p('Haritailesi Bülteni\'ne abone olmak için aşağıdaki butona tıklayarak e-posta adresinizi doğrulayın. Bu link 48 saat geçerlidir.') +
    btn('E-posta Adresimi Onayla', confirmUrl, 'primary') +
    divider() +
    smallNote('Bu e-postayı siz talep etmediyseniz görmezden gelebilirsiniz, abonelik gerçekleşmeyecektir.'),
  );
}

function commentVerify(v: V): string {
  const firstName = String(v.firstName || 'Ziyaretçi');
  const projectTitle = String(v.projectTitle || 'proje');
  const verifyUrl = String(v.verifyUrl || '#');
  return layout(
    `Yorumunuzu doğrulayın — ${projectTitle}`,
    h1('Yorum doğrulama') +
    p(`Merhaba ${firstName},`) +
    p(`<strong>${projectTitle}</strong> projesine yaptığınız yorum yayınlanmak için e-posta adresinizin doğrulanmasını bekliyor.`) +
    btn('Yorumu Doğrula', verifyUrl, 'primary') +
    divider() +
    smallNote('Bu bağlantı 48 saat geçerlidir. Eğer bu yorumu siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.'),
  );
}

// ─── Test Sertifikası ─────────────────────────────────────────────────────────

function testCertificate(v: V): string {
  const name = String(v.displayName || 'Değerli Katılımcı');
  const testTitle = String(v.testTitle || 'Test');
  const score = String(v.score || '');
  const maxScore = String(v.maxScore || '');
  const percent = String(v.percent || '');
  const date = String(v.date || new Date().toLocaleDateString('tr-TR'));
  const sahneUrl = `${process.env['SAHNE_URL'] ?? 'https://sahne.haritailesi.org'}/sen-ne-dersin`;
  return layout(
    `${testTitle} sertifikanız hazır`,
    greeting(name) +
    h1('Test Sertifikanız Hazır 🏆') +
    notice(`<strong>${esc(testTitle)}</strong> testini başarıyla tamamladınız ve sertifikanızı kazandınız!`, 'success') +
    infoBox([
      ['Test', esc(testTitle)],
      ['Skor', score && maxScore ? `${score} / ${maxScore} puan` : `${percent}%`],
      ['Başarı', `${percent}%`],
      ['Tarih', esc(date)],
    ]) +
    p('Sertifikanızı görüntülemek ve PDF olarak indirmek için aşağıdaki butona tıklayın.') +
    btn('Sertifikamı Görüntüle', sahneUrl) +
    divider() +
    smallNote('Bu e-posta Haritailesi Sen Ne Dersin? platformu üzerinden otomatik gönderilmiştir.'),
  );
}

// ─── Anket Katılım Teşekkür ───────────────────────────────────────────────────

function surveyParticipated(v: V): string {
  const name = String(v.displayName || 'Değerli Katılımcı');
  const surveyTitle = String(v.surveyTitle || 'Anket');
  const sahneUrl = `${process.env['SAHNE_URL'] ?? 'https://sahne.haritailesi.org'}/sen-ne-dersin`;
  return layout(
    `Anket yanıtınız alındı`,
    greeting(name) +
    h1('Yanıtınız Kaydedildi ✓') +
    p(`<strong>${esc(surveyTitle)}</strong> anketine katıldığınız için teşekkür ederiz. Yanıtlarınız topluluğun sesine katkı sağladı.`) +
    btn('Diğer Anketlere Bak', sahneUrl) +
    divider() +
    smallNote('Bu e-posta Haritailesi Sen Ne Dersin? platformu üzerinden otomatik gönderilmiştir.'),
  );
}

// ─── Mevzuat Güncelleme Bildirimi ─────────────────────────────────────────────

function libraryRegulationUpdate(v: V): string {
  const name = String(v.displayName || 'Değerli Üye');
  const regTitle = String(v.regulationTitle || 'Mevzuat');
  const regShortTitle = String(v.regulationShortTitle || regTitle);
  const changeNote = String(v.changeNote || '');
  const sahneUrl = `${process.env['SAHNE_URL'] ?? 'https://sahne.haritailesi.org'}/kutuphane/mevzuat/${String(v.regulationSlug || '')}`;
  return layout(
    `Takip ettiğiniz mevzuat güncellendi: ${regShortTitle}`,
    greeting(name) +
    h1('Takip Ettiğiniz Mevzuat Güncellendi') +
    notice(
      `<strong>${esc(regShortTitle)}</strong> mevzuatında güncelleme yapıldı.${changeNote ? `<br><em>${esc(changeNote)}</em>` : ''}`,
      'info',
    ) +
    p('Mevzuat takip sisteminiz sayesinde bu değişiklikten haberdar oldunuz. Güncel içeriği incelemek için aşağıdaki butona tıklayın.') +
    infoBox([
      ['Mevzuat', esc(regTitle)],
    ]) +
    btn('Mevzuatı İncele', sahneUrl) +
    divider() +
    p(`Bildirimleri almak istemiyorsanız <a href="${esc(sahneUrl)}" style="color:#294f73">mevzuat sayfasından</a> takibi bırakabilirsiniz.`) +
    smallNote('Bu e-posta Haritailesi Meslek Kütüphanesi takip sistemi üzerinden gönderilmiştir.'),
  );
}

// ─── Yarışma Kazanan Bildirimi ─────────────────────────────────────────────────

function competitionResultWinner(v: V): string {
  const name = String(v.displayName || 'Değerli Katılımcı');
  const competitionTitle = String(v.competitionTitle || 'Yarışma');
  const sahneUrl = `${process.env['SAHNE_URL'] ?? 'https://sahne.haritailesi.org'}/yarismalar`;
  return layout(
    `Tebrikler! ${competitionTitle} yarışmasını kazandınız`,
    greeting(name) +
    h1('Yarışmada Kazandınız! 🎉') +
    notice(`<strong>${esc(competitionTitle)}</strong> yarışmasında kazanan olarak seçildiniz. Haritailesi ekibi en kısa sürede sizinle iletişime geçecek.`, 'success') +
    p('Yarışma detayları ve ödül bilgileri için profilinizi kontrol edin. Ekibimiz ödül süreciyle ilgili ayrıca iletişime geçecektir.') +
    btn('Yarışmaları Görüntüle', sahneUrl, 'success') +
    divider() +
    smallNote('Bu e-posta Haritailesi Sahne platformu üzerinden gönderilmiştir.'),
  );
}
