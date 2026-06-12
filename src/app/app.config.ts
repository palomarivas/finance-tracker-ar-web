import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  isDevMode,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideTransloco } from '@jsverse/transloco';
import { provideEchartsCore } from 'ngx-echarts';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { TranslocoHttpLoader } from './transloco-loader';

const STORED_LANG = localStorage.getItem('ft.lang');

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideTransloco({
      config: {
        availableLangs: ['es', 'en'],
        defaultLang: STORED_LANG === 'en' ? 'en' : 'es',
        fallbackLang: 'es',
        reRenderOnLangChange: true,
        prodMode: !isDevMode(),
      },
      loader: TranslocoHttpLoader,
    }),
    provideEchartsCore({
      // Tree-shaken echarts: only the pie chart ships with the dashboard chunk.
      echarts: async () => {
        const echarts = await import('echarts/core');
        const [{ PieChart }, { TooltipComponent }, { CanvasRenderer }] =
          await Promise.all([
            import('echarts/charts'),
            import('echarts/components'),
            import('echarts/renderers'),
          ]);
        echarts.use([PieChart, TooltipComponent, CanvasRenderer]);
        return echarts;
      },
    }),
  ],
};
