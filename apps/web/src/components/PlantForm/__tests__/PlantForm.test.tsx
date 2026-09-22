import { Form } from 'antd';
import { describe, expect, it, vi } from 'vitest';

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderUi } from '../../../test/render';
import { PlantDateField } from '../PlantDateField';
import { PlantForm } from '../PlantForm';

describe('PlantForm', () => {
  it('рисует поля и отключённое состояние', () => {
    const enabled = renderUi(
      <Form
        initialValues={{
          lastFertilizedAt: '2026-09-22',
          lastWateredAt: '2026-09-22',
          locationKind: 'indoor',
        }}
      >
        <PlantForm />
      </Form>,
    );

    expect(enabled.container).toMatchSnapshot();
    enabled.unmount();

    const disabled = renderUi(
      <Form>
        <PlantForm disabled />
      </Form>,
    );

    expect(disabled.container).toMatchSnapshot();
  });

  it('ставит «Распознать» рядом с названием', async () => {
    const user = userEvent.setup();
    const onRecognize = vi.fn();
    const view = renderUi(
      <Form
        initialValues={{
          lastFertilizedAt: '2026-09-22',
          lastWateredAt: '2026-09-22',
          locationKind: 'indoor',
          name: '',
        }}
      >
        <PlantForm onRecognize={onRecognize} />
      </Form>,
    );
    const button = screen.getByRole('button', { name: 'Распознать' });

    expect(view.container).toMatchSnapshot();
    expect(button).toBeDisabled();

    await user.type(screen.getByPlaceholderText('Например, монстера'), '   ');
    expect(button).toBeDisabled();

    await user.type(screen.getByPlaceholderText('Например, монстера'), 'Фикус');
    expect(button).toBeEnabled();

    await user.click(button);
    expect(onRecognize).toHaveBeenCalledOnce();
    view.unmount();

    renderUi(
      <Form initialValues={{ name: 'Фикус' }}>
        <PlantForm disabled onRecognize={onRecognize} recognizeLoading />
      </Form>,
    );

    expect(screen.getByRole('button', { name: /Распознать/ })).toBeDisabled();
  });
});

describe('PlantDateField', () => {
  it('отдаёт выбранную дату и пустую строку при очистке', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = renderUi(
      <PlantDateField id="watered" onChange={onChange} value="2026-09-22" />,
    );

    expect(container).toMatchSnapshot();

    await user.click(screen.getByRole('textbox'));
    await user.click(await screen.findByTitle('2026-09-10'));
    expect(onChange).toHaveBeenCalledWith('2026-09-10');

    const picker = container.querySelector('.ant-picker');

    expect(picker).toBeInstanceOf(HTMLElement);

    await user.hover(picker as HTMLElement);

    const clear = container.querySelector('.ant-picker-clear');

    expect(clear).toBeInstanceOf(HTMLElement);

    await user.click(clear as HTMLElement);
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('рисует пустое и отключённое поле без onChange', async () => {
    const user = userEvent.setup();
    const empty = renderUi(<PlantDateField />);

    expect(empty.container).toMatchSnapshot();
    empty.unmount();

    const disabled = renderUi(<PlantDateField disabled value="2026-09-22" />);

    expect(disabled.container).toMatchSnapshot();

    await user.click(screen.getByRole('textbox'));
    expect(screen.queryByTitle('2026-09-10')).toBeNull();
  });
});
