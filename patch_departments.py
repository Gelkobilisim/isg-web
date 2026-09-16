import re

with open('src/App.jsx', 'r') as f:
    content = f.read()

target = """                                        <option value="">Departman Seçin...</option>
                                        <option value="all">Tüm Departmanlar (Herkes)</option>
                                        <option value="imalat_kaynak">İmalat - Kaynaklı İmalat</option>
                                        <option value="imalat_talasli">İmalat - Talaşlı İmalat</option>
                                        <option value="imalat_montaj">İmalat - Montaj</option>
                                        <option value="kalite">Kalite</option>
                                        <option value="depo_sevkiyat">Depo & Sevkiyat</option>
                                        <option value="bakim_onarim">Bakım & Onarım</option>
                                        <option value="boyahane">Boyahane</option>
                                        <option value="ik">İnsan Kaynakları</option>
                                        <option value="idari_isler">İdari İşler</option>
                                        <option value="satin_alma">Satın Alma</option>"""

new_target = """                                        <option value="">Departman Seçin...</option>
                                        <option value="all">Tüm Departmanlar (Herkes)</option>
                                        {DEPARTMENTS.map(d => (
                                            <option key={d} value={d}>{t(getDeptKey(d))}</option>
                                        ))}"""

content = content.replace(target, new_target)

with open('src/App.jsx', 'w') as f:
    f.write(content)
