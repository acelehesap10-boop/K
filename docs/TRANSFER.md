# Repository Transfer / Migration Guide

Bu rehber `K` projesini yeni bir GitHub reposuna taşımak için kısa, güvenli ve adım adım talimatlar içerir.

Ön koşullar

- Git yüklü
- `gh` (GitHub CLI) yüklü ve `gh auth login` ile oturum açılmış
- Yeni GitHub repoyu oluşturmaya yetkili kullanıcı veya organization üyeliği

1. Yeni repo oluşturun ve mirror ile taşıma

```bash
# Local repoyu mirror olarak yeni repoya aktar
./scripts/create-gh-repo-and-push.sh my-username new-repo private mirror
```

Not: Mirror seçeneği tüm refs (branches/tags/notes) kopyalanır; uzak repo'nuz, push-u görecektir.

2. Yeni repoyu test edin

```bash
# Check out new repo locally
git clone git@github.com:my-username/new-repo.git new-repo-check
cd new-repo-check
git log --oneline --decorate --graph
```

3. Clean/CI adaptasyonları

- Codeowners, Secrets, GitHub Actions -> yeni repoya transfer edin.
- Yeni Secrets ayarlayın; özellikle SNYK_TOKEN, DOCKER_HUB_TOKEN gibi CI oturum tokenları.

4. Issueların taşınması

- Issues, PR’lar, Wiki ve Projects için GitHub settings üzerinden 'Transfer' veya 3rd-party araçlar (GitHub API + ghe-migrator) kullanın.

5. Öneriler

- Güvenli erişim için yeni repoya 2FA zorunlu kılın.
- Organizational policies ile branch-protect ve merge kuralları oluşturun.
