# Setup SSH Agent

## Usage

```yml
steps:
  - uses: actions/checkout@v2
  - uses: glg-public/setup-ssh-agent@v1
    with:
      ssh-private-key: ${{ secrets.DEPLOYMENT_SSH_KEY }}
  - run: |
      npm clean-install
      npm run lint
      npm test
```
