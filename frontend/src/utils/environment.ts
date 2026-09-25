import { Environment, EnvVariable } from '../types';

export const replaceEnvVariables = (
  text: string,
  environment: Environment | null
): string => {
  if (!environment || !environment.variables) {
    return text;
  }

  let result = text;
  environment.variables.forEach((variable: EnvVariable) => {
    const pattern = new RegExp(`\\{\\{${variable.key}\\}\\}`, 'g');
    result = result.replace(pattern, variable.value);
  });

  return result;
};

export const extractEnvVariables = (text: string): string[] => {
  const regex = /\{\{([^}]+)\}\}/g;
  const matches: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (!matches.includes(match[1] as string)) {
      matches.push(match[1] as string);
    }
  }

  return matches;
};
