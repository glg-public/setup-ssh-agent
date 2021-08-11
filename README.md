# Setup SSH Agent

## Usage

```yml
steps:
  - uses: actions/checkout@main
  - uses: glg-public/setup-ssh-agent
    with:
      ssh-private-key: ${{ secrets.DEPLOYMENT_SSH_KEY }}
  - run: npm install
```
