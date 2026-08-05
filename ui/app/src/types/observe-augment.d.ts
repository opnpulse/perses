// Augments upstream @perses-dev types with fields the observe backend returns
// that aren't part of the published perses API surface.
import '@perses-dev/client';
import '@perses-dev/spec';

declare module '@perses-dev/client' {
  interface ProjectMetadata {
    folder?: string;
    folderName?: string;
  }
}

declare module '@perses-dev/spec' {
  interface DashboardSelector {
    folder?: string;
  }
}
