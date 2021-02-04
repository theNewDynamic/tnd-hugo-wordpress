## Remote Hugo with Sanity and WordPress

This repo is an R&D repo to investigate how we can efficiently build a Hugo website from remote data using Netlify Build Plugins.

We have three sources of content:
1. Local (md files created and git)
2. WordPress API (Publications and Blog posts)
3. Sanity API (Movies and Blog posts)

Critical source code for this work is in the `/build` directory where we store the two Build plugins.