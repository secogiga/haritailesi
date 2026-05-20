DO $$
DECLARE
  v_question_id UUID;
  v_admin_id UUID;
  v_mehmet_id UUID;
  v_mehmet_tier TEXT;
  v_alp_id UUID;
  v_alp_tier TEXT;
BEGIN
  SELECT id INTO v_admin_id FROM users WHERE email = 'admin@haritailesi.org';
  SELECT u.id, u.membership_tier INTO v_mehmet_id, v_mehmet_tier FROM users u WHERE u.email = 'mehmet.kaya@haritacilik.com';
  SELECT u.id, u.membership_tier INTO v_alp_id, v_alp_tier FROM users u WHERE u.email = 'alp.kilic@omu.edu.tr';

  INSERT INTO community_questions (
    id, user_id, email, display_name, question_text, category,
    status, is_mutfak_published, is_sahne_published, is_featured, show_full_name, source
  ) VALUES (
    gen_random_uuid(),
    (SELECT id FROM users WHERE email = 'neslihan.demir@geomatik.net'),
    'neslihan.demir@geomatik.net',
    'Neslihan Demir',
    'Saha çalışmalarında GNSS sinyalinin zayıf olduğu sıkışık kentsel alanlarda ölçüm kalitesini nasıl koruyorsunuz? Yersel ölçümle entegrasyonda hangi yöntemi tercih ediyorsunuz?',
    'klasik_haritacilik',
    'approved', true, true, false, true, 'sahne'
  ) RETURNING id INTO v_question_id;

  INSERT INTO community_answers (
    id, question_id, submitter_user_id, submitter_email, submitter_name,
    submitter_tier, body, source, show_full_name, is_published, approved_by
  ) VALUES (
    gen_random_uuid(),
    v_question_id,
    v_mehmet_id,
    'mehmet.kaya@haritacilik.com',
    'Mehmet Kaya',
    v_mehmet_tier,
    '12 yıldır her projede bu sorunla karşılaşıyoruz. Yöntemim şu: önce CORS veya statik GNSS ile sıkışık alana yakın açık noktalar belirleyin, bu noktaları totalstasyon ağının baz noktaları yapın. RTK çözümünde PDOP 3.5 üzeri ve uydu sayısı 6 altı ise ölçümü reddedin — kadastro gibi hukuki bağlayıcılığı olan çalışmalarda Fixed çözüm şartı esnemez. Motorize totalstasyon ile arka görüşü sağlayıp sıkışık alanda devam etmek en güvenli yöntem. Son not: mevcut kadastro paftalarındaki bağlaç noktalarını mutlaka kontrol edin, çoğu projede eski noktaların yeri kaymış çıkıyor.',
    'mutfak', true, true, v_admin_id
  );

  INSERT INTO community_answers (
    id, question_id, submitter_user_id, submitter_email, submitter_name,
    submitter_tier, body, source, show_full_name, is_published, approved_by
  ) VALUES (
    gen_random_uuid(),
    v_question_id,
    v_alp_id,
    'alp.kilic@omu.edu.tr',
    'Alp Kılıç',
    v_alp_tier,
    'Geçen yaz İstanbul''da bir kadastro stajında tam bu sorunla uğraştım. Bize öğretilen şunlar: binaların gölge haritasını Google Earth Pro''da ya da bir 3D modelleyicide çıkarın, GNSS ölçüm noktalarını gölgesiz alanlara konumlandırın. DJI ile kısa uçuş yapıp saha modelleme imkânı varsa engel analizi çok kolaylaşıyor. Açık görüşlü noktalarda TUSAGA-Aktif ile RTK, kapalı alanlarda totalstasyon; ikisini birleştirirken ortak noktaları en az 3 adet alın ve artık uyum kontrolü yapın. PDOP grafiğini anlık izleyerek ölçüm pencerelerini planlamak da hayat kurtarıyor.',
    'mutfak', true, true, v_admin_id
  );

  RAISE NOTICE 'Saha Q&A eklendi: question_id=%', v_question_id;
END $$;
