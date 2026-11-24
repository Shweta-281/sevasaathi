import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button, EmptyState } from './index.jsx';
import i18n from '../../i18n.js';
import { useTranslation } from 'react-i18next';

function LanguageLabel() {
  const { t } = useTranslation();
  return <span>{t('nav.dashboard')}</span>;
}

describe('shared interface basics', () => {
  it('renders a useful empty state', () => {
    render(<EmptyState title="No applications yet" description="Choose a service to begin." />);
    expect(screen.getByRole('heading', { name: 'No applications yet' })).toBeInTheDocument();
    expect(screen.getByText('Choose a service to begin.')).toBeInTheDocument();
  });

  it('disables an action while it is loading', () => {
    render(<Button loading>Save</Button>);
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('translates the dashboard navigation label to Hindi', async () => {
    await i18n.changeLanguage('hi');
    render(<LanguageLabel />);
    expect(screen.getByText('डैशबोर्ड')).toBeInTheDocument();
    await i18n.changeLanguage('en');
  });
});
