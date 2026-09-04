content = open('components/LegalPanel.tsx').read()
content = content.replace("import { getStoreConfig } from '../lib/db';", "import { databaseService } from '../services/databaseService';")
old_effect = """  useEffect(() => {
    getStoreConfig().then(config => {
      if (config) {
        setTermsData(config.termsOfService || '');
        setPrivacyData(config.privacyPolicy || '');
        setRefundData(config.refundPolicy || '');
      }
    });
  }, []);"""
new_effect = """  useEffect(() => {
    Promise.all([
      databaseService.getPanelContent('terms'),
      databaseService.getPanelContent('privacy'),
      databaseService.getPanelContent('refund')
    ]).then(([terms, privacy, refund]) => {
      if (terms) setTermsData(terms);
      if (privacy) setPrivacyData(privacy);
      if (refund) setRefundData(refund);
    });
  }, []);"""
content = content.replace(old_effect, new_effect)
open('components/LegalPanel.tsx', 'w').write(content)
