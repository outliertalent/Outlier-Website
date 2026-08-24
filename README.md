# Outlier Talent website handoff

This package contains the complete Outlier Talent website. It is independent of the developer's Vercel account and contains no `.vercel` project link, login token, environment file, or other credential.

## Assumed production domain

The roster form is configured for:

`https://outliertalent.com/`

If the real domain is different, open `index.html` and change the value of the hidden input named `_url` before deploying.

## Recommended deployment

### 1. Create the source repository

1. Sign in to the GitHub account that should permanently own this website.
2. Create a new private repository named `outlier-talent`.
3. Extract `Outlier-Talent-Handoff.zip` on your computer.
4. In the new GitHub repository, choose **Add file**, then **Upload files**.
5. Upload the contents of the extracted `outlier-talent` folder. Upload the files and `assets` folder, not the ZIP file itself.
6. Commit the uploaded files to the `main` branch.

### 2. Deploy from the owner's Vercel account

1. Sign in to Vercel using the account that should own the website and billing.
2. Choose **Add New**, then **Project**.
3. Import the `outlier-talent` GitHub repository.
4. Use **Other** as the framework preset.
5. Leave the Build Command and Output Directory empty.
6. Select **Deploy**.
7. Test the generated `vercel.app` address before connecting the custom domain.

No additional Vercel team member is needed for this workflow.

## Connect the Wix-managed domain

1. In the new Vercel project, open **Settings**, then **Domains**.
2. Add `outliertalent.com` and `www.outliertalent.com`.
3. Choose the preferred primary version and configure the other one to redirect to it.
4. Copy the exact A and CNAME values Vercel displays.
5. In Wix, open the domain's **Manage DNS Records** screen.
6. Replace only the existing Wix website A and `www` CNAME records with Vercel's values.
7. Do not remove MX, SPF, DKIM, or DMARC records. Those may be required for `aaron@outliertalent.com` email delivery.
8. Wait for Vercel to verify the records and issue SSL, then test both domain versions.
9. Keep the old Wix site plan until the new domain has been tested successfully.

## Roster request delivery

Roster requests are sent to `aaron@outliertalent.com` through FormSubmit.

The first real submission triggers a one-time FormSubmit activation email. Aaron must open that email and confirm the form before normal delivery begins. Check spam or junk if the activation message is not visible.

## Future updates

Edit the files in the owner's GitHub repository and commit the changes to `main`. Vercel will automatically deploy the latest commit.

## Local preview

If Python is installed, run this command in the project folder:

```powershell
python -m http.server 4173
```

Then open `http://localhost:4173`.

