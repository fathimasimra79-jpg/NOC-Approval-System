## Packages
framer-motion | Smooth page transitions and polished entry animations
jwt-decode | Safely decoding the auth token if needed
lucide-react | Icons for the interface

## Notes
- Authentication uses a JWT Bearer token strategy. Tokens and user details are stored in localStorage.
- Protected API calls expect the `Authorization: Bearer <token>` header.
- Custom `api-client` wrapper is used to automatically attach this header to all requests.
- No `/api/me` endpoint was provided in the manifest, so user state is re-hydrated from localStorage on initial load.
- Tailwind Config assumption: `font-sans` maps to Inter, and a display font is used for headings.
