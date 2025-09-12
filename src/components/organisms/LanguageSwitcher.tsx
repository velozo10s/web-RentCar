import * as React from 'react';
import {useTranslation} from 'react-i18next';
import {
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import CheckIcon from '@mui/icons-material/Check';
import type {IconButtonProps} from '@mui/material/IconButton';

import {useStore} from '../../lib/hooks/useStore.ts';
import {SUPPORTED_LANGUAGES} from '../../lib/constants/languages';

type LanguageSwitcherProps = {
  /** Pass styles/size/etc to the IconButton if needed (e.g., sx positioning) */
  iconButtonProps?: IconButtonProps;
};

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  iconButtonProps,
}) => {
  const {t} = useTranslation();
  const {languageStore} = useStore();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  const handleSelect = async (langId: string) => {
    if (langId !== languageStore.language) {
      await languageStore.setLanguage(langId);
    }
    handleClose();
  };

  return (
    <>
      <Tooltip title={t('modals.selectLanguageModal.title') || 'Language'}>
        <IconButton
          aria-label={t('modals.selectLanguageModal.title') || 'Language'}
          size="small"
          onClick={handleOpen}
          {...iconButtonProps}>
          <TranslateIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
        transformOrigin={{vertical: 'top', horizontal: 'right'}}>
        {SUPPORTED_LANGUAGES.map(lang => {
          const selected = languageStore.language === lang.id;
          return (
            <MenuItem
              key={lang.id}
              onClick={() => handleSelect(lang.id)}
              selected={selected}
              dense>
              <ListItemText primary={t(lang.labelKey)} />
              {selected && (
                <ListItemIcon sx={{minWidth: 30}}>
                  <CheckIcon fontSize="small" />
                </ListItemIcon>
              )}
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
};

export default LanguageSwitcher;
